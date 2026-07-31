package com.example.Backend.Service;

import com.example.Backend.Dto.HospitalDto;
import com.example.Backend.Dto.HospitalRouteDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HospitalService {

    private final GeoapifyPlacesService geoapifyPlacesService;
    private final OpenRouteServiceService openRouteServiceService;

    public List<HospitalDto> searchHospitals(Double lat, Double lon, Double radiusMeters, String query, String categoryFilter) {
        return geoapifyPlacesService.searchNearbyHospitals(lat, lon, radiusMeters, query, categoryFilter);
    }

    public HospitalRouteDto.Response calculateRoute(HospitalRouteDto.Request req) {
        return openRouteServiceService.calculateDrivingRoute(req);
    }
}
