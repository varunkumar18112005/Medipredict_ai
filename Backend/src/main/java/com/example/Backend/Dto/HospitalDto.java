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
public class HospitalDto {
    private String id;
    private String name;
    private Double rating;
    private Double distanceKm;
    private String distanceFormatted;
    private Double lat;
    private Double lon;
    private String address;
    private String phone;
    private String category;
    private String specialization;
    private Boolean isEmergency;
    private Boolean isOpen24Hours;
    private List<String> facilities;
}
