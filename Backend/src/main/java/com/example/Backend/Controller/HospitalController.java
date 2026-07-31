package com.example.Backend.Controller;

import com.example.Backend.Dto.HospitalDto;
import com.example.Backend.Dto.HospitalRouteDto;
import com.example.Backend.Service.GeoapifyPlacesService;
import com.example.Backend.Service.OpenRouteServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hospitals")
@RequiredArgsConstructor
@Tag(name = "Hospitals", description = "Real-world hospital search via Geoapify and driving routes via OpenRouteService")
public class HospitalController {

    private final GeoapifyPlacesService geoapifyPlacesService;
    private final OpenRouteServiceService openRouteServiceService;

    @GetMapping("/nearby")
    @Operation(summary = "Get nearby hospitals and clinics from Geoapify v2 Places API")
    public ResponseEntity<List<HospitalDto>> getNearbyHospitals(
            @RequestParam(required = false, defaultValue = "13.6288") Double lat,
            @RequestParam(required = false, defaultValue = "79.4192") Double lon,
            @RequestParam(required = false, defaultValue = "25000") Double radius,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(geoapifyPlacesService.searchNearbyHospitals(lat, lon, radius, query, category));
    }

    @GetMapping("/search")
    @Operation(summary = "Search real hospitals and medical centers")
    public ResponseEntity<List<HospitalDto>> searchHospitals(
            @RequestParam(required = false, defaultValue = "13.6288") Double lat,
            @RequestParam(required = false, defaultValue = "79.4192") Double lon,
            @RequestParam(required = false, defaultValue = "25000") Double radius,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(geoapifyPlacesService.searchNearbyHospitals(lat, lon, radius, query, category));
    }

    @PostMapping("/route")
    @Operation(summary = "Calculate driving route via OpenRouteService Directions API (POST)")
    public ResponseEntity<HospitalRouteDto.Response> calculateRoutePost(@RequestBody HospitalRouteDto.Request request) {
        return ResponseEntity.ok(openRouteServiceService.calculateDrivingRoute(request));
    }

    @GetMapping("/route")
    @Operation(summary = "Calculate driving route via OpenRouteService Directions API (GET)")
    public ResponseEntity<HospitalRouteDto.Response> calculateRouteGet(
            @RequestParam(required = false) Double originLat,
            @RequestParam(required = false) Double originLon,
            @RequestParam(required = false) Double destinationLat,
            @RequestParam(required = false) Double destinationLon,
            @RequestParam(required = false) String hospitalId) {
        HospitalRouteDto.Request request = new HospitalRouteDto.Request(originLat, originLon, destinationLat, destinationLon, hospitalId);
        return ResponseEntity.ok(openRouteServiceService.calculateDrivingRoute(request));
    }
}
