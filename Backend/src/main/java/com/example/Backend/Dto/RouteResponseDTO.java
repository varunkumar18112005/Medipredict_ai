package com.example.Backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponseDTO {
    private String hospitalId;
    private String distance;
    private double distanceKm;
    private double distanceMeters;
    private String distanceFormatted;
    private String duration;
    private double durationMinutes;
    private double durationSeconds;
    private String durationFormatted;
    private String encodedPolyline;
    private List<List<Double>> polylineCoordinates; // List of [lat, lon] pairs
    private List<String> navigationSteps;
    private boolean routeAvailable;
    private String navigationUrl;
}
