package com.example.Backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeocodeResultDto {
    private Double lat;
    private Double lon;
    private String displayName;
    private String cityName;
    private String country;
    private String state;
    private String district;
}
