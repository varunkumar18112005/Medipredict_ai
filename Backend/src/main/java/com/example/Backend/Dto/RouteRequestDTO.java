package com.example.Backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteRequestDTO {
    private double originLat;
    private double originLon;
    private double originLng;
    private double destinationLat;
    private double destinationLon;
    private double destinationLng;
    private String hospitalId;

    public double getOriginLon() {
        return originLon != 0 ? originLon : originLng;
    }

    public double getOriginLng() {
        return originLng != 0 ? originLng : originLon;
    }

    public double getDestinationLon() {
        return destinationLon != 0 ? destinationLon : destinationLng;
    }

    public double getDestinationLng() {
        return destinationLng != 0 ? destinationLng : destinationLon;
    }
}
