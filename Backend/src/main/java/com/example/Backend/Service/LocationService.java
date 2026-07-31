package com.example.Backend.Service;

import com.example.Backend.Dto.GeocodeResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class LocationService {

    @Value("${google.maps.api-key:${google.places.api-key:}}")
    private String googleApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public GeocodeResponseDTO geocodeAddress(String country, String state, String district) {
        StringBuilder addressBuilder = new StringBuilder();
        if (district != null && !district.trim().isEmpty()) addressBuilder.append(district.trim());
        if (state != null && !state.trim().isEmpty()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(state.trim());
        }
        if (country != null && !country.trim().isEmpty()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(country.trim());
        }

        String fullAddress = addressBuilder.toString();
        System.out.println(String.format(Locale.US, "[LocationService] Geocoding request for address: '%s'", fullAddress));

        if (googleApiKey != null && !googleApiKey.trim().isEmpty() && !googleApiKey.contains("YOUR_KEY")) {
            try {
                String encodedAddress = URLEncoder.encode(fullAddress, StandardCharsets.UTF_8);
                String geocodeUrl = String.format(Locale.US,
                        "https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s",
                        encodedAddress, googleApiKey
                );

                System.out.println("[LocationService] Calling Google Geocoding API: " + geocodeUrl.replaceAll("key=[^&]+", "key=HIDDEN"));

                Map<String, Object> response = restTemplate.getForObject(geocodeUrl, Map.class);
                System.out.println("[LocationService] Google Geocoding API response status: " + (response != null ? response.get("status") : "null"));

                if (response != null && "OK".equals(response.get("status"))) {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                    if (results != null && !results.isEmpty()) {
                        Map<String, Object> geometry = (Map<String, Object>) results.get(0).get("geometry");
                        Map<String, Object> location = geometry != null ? (Map<String, Object>) geometry.get("location") : null;

                        if (location != null) {
                            double lat = ((Number) location.get("lat")).doubleValue();
                            double lng = ((Number) location.get("lng")).doubleValue();
                            System.out.println(String.format(Locale.US, "[LocationService] Successfully resolved coordinates: Lat %.6f, Lng %.6f", lat, lng));
                            return new GeocodeResponseDTO(lat, lng);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[LocationService] Google Geocoding API error: " + e.getMessage());
            }
        }

        // Fallback default coordinates if geocoding fails or API key is not active (e.g. Tirupati)
        System.out.println(String.format(Locale.US, "[LocationService] Geocoding fallback for '%s'", fullAddress));
        return new GeocodeResponseDTO(13.6288, 79.4192);
    }
}
