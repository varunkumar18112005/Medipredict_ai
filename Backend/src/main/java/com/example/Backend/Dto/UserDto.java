package com.example.Backend.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserDto {

    // ── Update Profile Request ────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String firstName;
        private String lastName;
        private LocalDate dateOfBirth;
        private String gender;
        private String email;
    }

    // ── Profile Response ──────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private Long id;
        private String healthId;
        private String firstName;
        private String lastName;
        private String email;
        private LocalDate dateOfBirth;
        private String gender;
        private String role;
        private String profilePictureUrl;
        private boolean emailVerified;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ── Health Profile Request ────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateHealthProfileRequest {
        private Double height;
        private Double weight;
        private Double glucoseLevel;
        private Integer bloodPressureSystolic;
        private Integer bloodPressureDiastolic;
        private Double insulinLevel;
        private Integer heartRate;
        private String smokingStatus;
        private String alcoholConsumption;
        private String physicalActivityLevel;
        private String dietType;
        private String existingConditions;
        private String currentMedications;
        private String familyHistory;
        private String allergies;
    }

    // ── Health Profile Response ───────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthProfileResponse {
        private Long id;
        private Double height;
        private Double weight;
        private Double bmi;
        private Double glucoseLevel;
        private Integer bloodPressureSystolic;
        private Integer bloodPressureDiastolic;
        private Double insulinLevel;
        private Integer heartRate;
        private String smokingStatus;
        private Integer totalAssessments;
        private String avgRiskLevel;
        private Double avgRiskScore;
        private LocalDateTime nextCheckupDate;
        private String nextCheckupIn;
        private String alcoholConsumption;
        private String physicalActivityLevel;
        private String dietType;
        private String existingConditions;
        private String currentMedications;
        private String familyHistory;
        private String allergies;
        private LocalDateTime lastUpdated;
    }

    // ── Stats Response (profile screen) ──────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private String avgRiskLevel;
        private Double avgRiskScore;
        private Integer totalAssessments;
        private Double riskChangePct; // e.g. -2% shown on profile
        private Integer newAssessmentsThisMonth;
        private LocalDateTime nextCheckupDate;
        private String nextCheckupIn;
    }
}
