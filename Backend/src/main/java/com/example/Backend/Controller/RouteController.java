package com.example.Backend.Controller;

import com.example.Backend.Dto.HospitalRouteDto;
import com.example.Backend.Service.OpenRouteServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/routes")
@RequiredArgsConstructor
@Tag(name = "Routes", description = "Driving route calculation via OpenRouteService API")
public class RouteController {

    private final OpenRouteServiceService openRouteServiceService;

    @PostMapping
    @Operation(summary = "Generate driving route between coordinates via OpenRouteService (POST)")
    public ResponseEntity<HospitalRouteDto.Response> calculateRoutePost(@RequestBody HospitalRouteDto.Request request) {
        return ResponseEntity.ok(openRouteServiceService.calculateDrivingRoute(request));
    }

    @GetMapping
    @Operation(summary = "Generate driving route between coordinates via OpenRouteService (GET)")
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
