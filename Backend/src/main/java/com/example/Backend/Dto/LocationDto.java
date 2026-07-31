package com.example.Backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class LocationDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CountryResponseDto {
        private String id;
        private String name;
        private String flag;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StateResponseDto {
        private String id;
        private String name;
        private String countryId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistrictResponseDto {
        private String id;
        private String name;
        private String stateId;
        private Double latitude;
        private Double longitude;
    }
}
