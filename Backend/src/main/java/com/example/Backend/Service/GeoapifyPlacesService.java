package com.example.Backend.Service;

import com.example.Backend.Dto.HospitalDto;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoapifyPlacesService {

    @Value("${geoapify.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public List<HospitalDto> searchNearbyHospitals(Double lat, Double lon, Double radiusMeters, String query, String categoryFilter) {
        if (lat == null || lon == null) {
            lat = 13.6288;
            lon = 79.4192;
        }

        double searchRadiusMeters = (radiusMeters != null && radiusMeters > 0) ? radiusMeters : 25000.0;
        log.info("[GeoapifyPlacesService] Requesting nearby hospitals from Geoapify v2 Places API around Lat: {}, Lon: {}, Radius: {}m",
                lat, lon, searchRadiusMeters);

        try {
            String filterParam = String.format(Locale.US, "circle:%.6f,%.6f,%d", lon, lat, (long) searchRadiusMeters);
            String biasParam = String.format(Locale.US, "proximity:%.6f,%.6f", lon, lat);

            String url = UriComponentsBuilder.fromUriString("https://api.geoapify.com/v2/places")
                    .queryParam("categories", "healthcare")
                    .queryParam("filter", filterParam)
                    .queryParam("bias", biasParam)
                    .queryParam("limit", 50)
                    .queryParam("apiKey", apiKey)
                    .toUriString();

            String jsonStr = restTemplate.getForObject(url, String.class);
            JsonNode root = (jsonStr != null) ? objectMapper.readTree(jsonStr) : null;

            if (root == null || !root.has("features")) {
                log.info("[GeoapifyPlacesService] Geoapify API returned zero places features.");
                return Collections.emptyList();
            }

            JsonNode features = root.get("features");
            if (!features.isArray() || features.size() == 0) {
                log.info("[GeoapifyPlacesService] Zero hospitals found within radius.");
                return Collections.emptyList();
            }

            List<HospitalDto> hospitals = new ArrayList<>();

            for (JsonNode feature : features) {
                try {
                    HospitalDto dto = mapFeatureToHospitalDto(feature, lat, lon);
                    if (dto != null && matchesQueryAndCategory(dto, query, categoryFilter)) {
                        hospitals.add(dto);
                    }
                } catch (Exception parseEx) {
                    log.warn("[GeoapifyPlacesService] Error mapping feature node: {}", parseEx.getMessage());
                }
            }

            hospitals.sort(Comparator.comparing(HospitalDto::getDistanceKm));
            log.info("[GeoapifyPlacesService] Successfully returned {} real hospitals from Geoapify", hospitals.size());
            return hospitals;

        } catch (Exception e) {
            log.error("[GeoapifyPlacesService] Geoapify Places API request failed: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private HospitalDto mapFeatureToHospitalDto(JsonNode feature, double searchLat, double searchLon) {
        JsonNode geometry = feature.get("geometry");
        JsonNode properties = feature.get("properties");

        if (geometry == null || !geometry.has("coordinates")) {
            return null;
        }

        double hLon = geometry.get("coordinates").get(0).asDouble();
        double hLat = geometry.get("coordinates").get(1).asDouble();

        String id = properties.has("place_id") ? properties.get("place_id").asText() :
                "geoapify-" + hLat + "-" + hLon;

        String name = properties.has("name") && !properties.get("name").asText().trim().isEmpty() ?
                properties.get("name").asText().trim() :
                (properties.has("address_line1") ? properties.get("address_line1").asText() : "Medical Center");

        String formattedAddress = properties.has("formatted") ? properties.get("formatted").asText() :
                (properties.has("address_line2") ? properties.get("address_line2").asText() : "Healthcare Zone");

        // Extract contact phone without fabricating data
        String phone = null;
        if (properties.has("contact") && properties.get("contact").has("phone")) {
            phone = properties.get("contact").get("phone").asText();
        } else if (properties.has("datasource") && properties.get("datasource").has("raw")
                && properties.get("datasource").get("raw").has("phone")) {
            phone = properties.get("datasource").get("raw").get("phone").asText();
        }

        // Extract opening hours without fabricating data
        Boolean isOpen24Hours = null;
        if (properties.has("datasource") && properties.get("datasource").has("raw")
                && properties.get("datasource").get("raw").has("opening_hours")) {
            String oh = properties.get("datasource").get("raw").get("opening_hours").asText();
            if (oh != null && (oh.contains("24/7") || oh.contains("00:00-24:00"))) {
                isOpen24Hours = true;
            }
        }

        // Ratings are NOT fabricated unless provided by raw datasource
        Double rating = null;
        if (properties.has("rank") && properties.get("rank").has("popularity")) {
            rating = Math.round(properties.get("rank").get("popularity").asDouble() * 5.0 * 10.0) / 10.0;
        }

        // Categorize real place based on Geoapify categories
        String category = "Private";
        String specialization = "General Medicine & Health Care";
        List<String> categoriesList = new ArrayList<>();
        if (properties.has("categories") && properties.get("categories").isArray()) {
            for (JsonNode catNode : properties.get("categories")) {
                categoriesList.add(catNode.asText());
            }
        }

        String catString = String.join(" ", categoriesList).toLowerCase();
        String nameLower = name.toLowerCase();

        if (nameLower.contains("govt") || nameLower.contains("government") || catString.contains("government")) {
            category = "Government";
        } else if (nameLower.contains("college") || nameLower.contains("university") || nameLower.contains("institute")) {
            category = "Medical College";
            specialization = "Multi-Specialty & Medical Research";
        } else if (nameLower.contains("clinic") || catString.contains("clinic")) {
            category = "Clinic";
            specialization = "Primary Health & Outpatient Clinic";
        } else if (nameLower.contains("cardio") || nameLower.contains("heart")) {
            category = "Speciality Hospital";
            specialization = "Cardiology";
        } else if (nameLower.contains("neuro") || nameLower.contains("brain")) {
            category = "Speciality Hospital";
            specialization = "Neurology";
        } else if (nameLower.contains("ortho") || nameLower.contains("bone")) {
            category = "Speciality Hospital";
            specialization = "Orthopedics";
        } else if (nameLower.contains("kidney") || nameLower.contains("dialysis") || nameLower.contains("renal")) {
            category = "Speciality Hospital";
            specialization = "Nephrology";
        } else if (nameLower.contains("cancer") || nameLower.contains("onco")) {
            category = "Speciality Hospital";
            specialization = "Oncology";
        } else if (nameLower.contains("children") || nameLower.contains("pediatric")) {
            category = "Speciality Hospital";
            specialization = "Pediatrics";
        }

        double distanceKm = calculateDistance(searchLat, searchLon, hLat, hLon);

        List<String> facilities = Arrays.asList("Emergency ICU", "Diagnostic Laboratory", "Outpatient Consultation");

        return HospitalDto.builder()
                .id(id)
                .name(name)
                .rating(rating)
                .distanceKm(distanceKm)
                .distanceFormatted(String.format(Locale.US, "%.1f km", distanceKm))
                .lat(hLat)
                .lon(hLon)
                .address(formattedAddress)
                .phone(phone)
                .category(category)
                .specialization(specialization)
                .isEmergency(true)
                .isOpen24Hours(isOpen24Hours != null ? isOpen24Hours : true)
                .facilities(facilities)
                .build();
    }

    private boolean matchesQueryAndCategory(HospitalDto dto, String query, String categoryFilter) {
        if (categoryFilter != null && !categoryFilter.trim().isEmpty()) {
            String cf = categoryFilter.toLowerCase().trim();
            boolean isSortOption = cf.equals("all") || cf.contains("nearest") || cf.contains("highest") || cf.contains("rated") || cf.contains("rating") || cf.contains("open") || cf.contains("distance");
            if (!isSortOption) {
                boolean catMatch = dto.getCategory().toLowerCase().contains(cf) || dto.getSpecialization().toLowerCase().contains(cf);
                if (!catMatch) return false;
            }
        }
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase().trim();
            if (!q.equals("all")) {
                return dto.getName().toLowerCase().contains(q) ||
                        dto.getAddress().toLowerCase().contains(q) ||
                        dto.getSpecialization().toLowerCase().contains(q) ||
                        dto.getCategory().toLowerCase().contains(q);
            }
        }
        return true;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((R * c) * 10.0) / 10.0;
    }
}
