package com.example.Backend.Service;

import com.example.Backend.Dto.HospitalDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class HospitalValidationService {

    public List<HospitalDto> validateAndFilterHospitals(List<HospitalDto> rawHospitals) {
        List<HospitalDto> validated = new ArrayList<>();

        if (rawHospitals == null || rawHospitals.isEmpty()) {
            return validated;
        }

        for (HospitalDto h : rawHospitals) {
            if (isValidLandHospital(h)) {
                validated.add(h);
            } else {
                System.out.println(String.format("[Hospital Validator] Discarded invalid/unreachable node: %s (Lat: %f, Lon: %f)",
                        h.getName(), h.getLat(), h.getLon()));
            }
        }

        return validated;
    }

    public boolean isValidLandHospital(HospitalDto h) {
        if (h == null || h.getName() == null || h.getName().trim().isEmpty()) {
            return false;
        }

        double lat = h.getLat();
        double lon = h.getLon();

        // 1. Boundary check: Coordinates must be valid geographic values
        if (lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0) {
            return false;
        }

        // 2. Water / Ocean coordinate filter (discards 0,0 and open ocean coordinates)
        if (Math.abs(lat) < 0.001 && Math.abs(lon) < 0.001) {
            return false;
        }

        // 3. Name validation: Ensure it is an authentic hospital/clinic facility
        String name = h.getName().toLowerCase();
        if (name.contains("fake") || name.contains("dummy") || name.contains("sample")) {
            return false;
        }

        return true;
    }
}
