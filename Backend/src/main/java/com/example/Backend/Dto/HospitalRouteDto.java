package com.example.Backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class HospitalRouteDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Double originLat;
        private Double originLon;
        private Double destinationLat;
        private Double destinationLon;
        private String hospitalId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String hospitalId;
        private Double distanceKm;
        private String distanceFormatted;
        private Integer durationMinutes;
        private String durationFormatted;
        private List<Double[]> polylineCoordinates;
        private List<String> navigationSteps;
        private Boolean routeAvailable;
        private String navigationUrl;
    }
}
