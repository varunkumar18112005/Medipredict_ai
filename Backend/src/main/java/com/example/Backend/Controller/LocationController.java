package com.example.Backend.Controller;

import com.example.Backend.Dto.GeocodeResultDto;
import com.example.Backend.Service.GeoapifyGeocodingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/location")
@RequiredArgsConstructor
@Tag(name = "Location", description = "Geocoding location services via Geoapify API")
public class LocationController {

    private final GeoapifyGeocodingService geocodingService;

    @GetMapping("/geocode")
    @Operation(summary = "Geocode country, state, district, city or custom address to Lat/Lon")
    public ResponseEntity<GeocodeResultDto> geocode(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String customLocation,
            @RequestParam(required = false) String query) {
        String inputQuery = (customLocation != null && !customLocation.trim().isEmpty()) ? customLocation : query;
        GeocodeResultDto result = geocodingService.geocode(country, state, district, city, inputQuery);
        return ResponseEntity.ok(result);
    }
}
