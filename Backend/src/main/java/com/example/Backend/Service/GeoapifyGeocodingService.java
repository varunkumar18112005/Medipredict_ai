package com.example.Backend.Service;

import com.example.Backend.Dto.GeocodeResultDto;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoapifyGeocodingService {

    @Value("${geoapify.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private final Map<String, GeocodeResultDto> localCache = new ConcurrentHashMap<>();

    @Cacheable(value = "geocoding", key = "#country + '_' + #state + '_' + #district + '_' + #city + '_' + #customLocation")
    public GeocodeResultDto geocode(String country, String state, String district, String city, String customLocation) {
        StringBuilder searchText = new StringBuilder();
        if (customLocation != null && !customLocation.trim().isEmpty()) {
            searchText.append(customLocation.trim());
        } else {
            if (city != null && !city.trim().isEmpty()) searchText.append(city.trim()).append(", ");
            if (district != null && !district.trim().isEmpty()) searchText.append(district.trim()).append(", ");
            if (state != null && !state.trim().isEmpty()) searchText.append(state.trim()).append(", ");
            if (country != null && !country.trim().isEmpty()) searchText.append(country.trim());
        }

        String query = searchText.toString().replaceAll(", $", "").trim();
        if (query.isEmpty()) {
            query = "India";
        }

        String cacheKey = query.toLowerCase();
        if (localCache.containsKey(cacheKey)) {
            log.info("[GeoapifyGeocodingService] Cache hit for query: {}", query);
            return localCache.get(cacheKey);
        }

        log.info("[GeoapifyGeocodingService] Geocoding location via Geoapify API: {}", query);

        GeocodeResultDto result = performGeoapifySearch(query, country, state, district);
        if (result == null && !query.toLowerCase().contains("india")) {
            log.info("[GeoapifyGeocodingService] Retrying geocoding with ', India' appended: {}", query + ", India");
            result = performGeoapifySearch(query + ", India", country, state, district);
        }

        if (result == null) {
            log.warn("[GeoapifyGeocodingService] Geoapify returned 0 features for {}. Using fallback coordinates.", query);
            result = GeocodeResultDto.builder()
                    .lat(13.6288)
                    .lon(79.4192)
                    .displayName(query + " (Fallback Location)")
                    .cityName(city != null ? city : "Tirupati")
                    .country(country)
                    .state(state)
                    .district(district)
                    .build();
        }

        localCache.put(cacheKey, result);
        return result;
    }

    private GeocodeResultDto performGeoapifySearch(String searchQuery, String country, String state, String district) {
        try {
            String url = UriComponentsBuilder.fromUriString("https://api.geoapify.com/v1/geocode/search")
                    .queryParam("text", searchQuery)
                    .queryParam("limit", 1)
                    .queryParam("apiKey", apiKey)
                    .toUriString();

            String jsonStr = restTemplate.getForObject(url, String.class);
            JsonNode root = (jsonStr != null) ? objectMapper.readTree(jsonStr) : null;

            if (root != null && root.has("features") && root.get("features").isArray() && root.get("features").size() > 0) {
                JsonNode feature = root.get("features").get(0);
                JsonNode geometry = feature.get("geometry");
                JsonNode properties = feature.get("properties");

                Double lon = geometry.get("coordinates").get(0).asDouble();
                Double lat = geometry.get("coordinates").get(1).asDouble();

                String displayName = properties.has("formatted") ? properties.get("formatted").asText() : searchQuery;
                String foundCity = properties.has("city") ? properties.get("city").asText() :
                        (properties.has("district") ? properties.get("district").asText() : searchQuery);

                return GeocodeResultDto.builder()
                        .lat(lat)
                        .lon(lon)
                        .displayName(displayName)
                        .cityName(foundCity)
                        .country(country)
                        .state(state)
                        .district(district)
                        .build();
            }
        } catch (Exception e) {
            log.error("[GeoapifyGeocodingService] Exception during geocoding for {}: {}", searchQuery, e.getMessage());
        }
        return null;
    }
}
