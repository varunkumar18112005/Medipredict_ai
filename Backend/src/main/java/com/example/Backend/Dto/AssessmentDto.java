package com.example.Backend.Dto;

import com.example.Backend.model.Assessment;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AssessmentDto {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "Disease type is required")
        private Assessment.DiseaseType diseaseType;

        // Shared / General
        private String userName;
        private Long reportId;
        private Integer age;
        private Double bmi;
        private Double bloodPressure;

        // 1. Diabetes fields
        private Double glucose;
        private Double hba1c;
        private Double insulin;

        // 2. Cardiovascular fields
        private Double restingBP;
        private Double cholesterol;
        private Integer fastingBS;
        private Integer restingECG;
        private Integer maxHeartRate;
        private Integer chestPainType;

        // 3. Hepatic fields
        private Double totalBilirubin;
        private Double directBilirubin;
        private Double alt;
        private Double ast;
        private Double alp;
        private Double albumin;

        // 4. Renal fields
        private Double serumCreatinine;
        private Double bloodUrea;
        private Double egfr;
        private Double urineAlbumin;
        private Double haemoglobin;

        // 5. Thyroid fields
        private Double tsh;
        private Double freeT3;
        private Double freeT4;
        private Double antiTpo;

        // 6. Pulmonary fields
        private Double oxygenSaturation;
        private Double fev1;
        private Double fvc;
        private Double fev1FvcRatio;
        private Integer respiratoryRate;
        private Integer smokingHistory;

        // 7. Stroke fields
        private Integer heartDiseaseHistory;

        // 8. Anemia fields
        private Double rbcCount;
        private Double hematocrit;
        private Double mcv;
        private Double mch;
        private Double ferritin;

        // Compatibility alias getters
        public Integer getHeartRate() {
            return maxHeartRate;
        }

        public Double getAlkalinePhosphotase() {
            return alp;
        }

        public Double getT3() {
            return freeT3;
        }

        public Double getT4() {
            return freeT4;
        }

        public Double getAvgGlucoseLevel() {
            return glucose;
        }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id;
        private Assessment.DiseaseType diseaseType;
        private Double riskScore;
        private String riskLevel;
        private Double riskTrend;
        private List<RiskFactor> riskFactors;
        private List<String> suggestions;
        private Assessment.AssessmentStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RiskFactor {
        private String name;
        private String value;
        private String level;   // HIGH, MODERATE, NORMAL
        private Double score;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class HistoryResponse {
        private Long id;
        private Assessment.DiseaseType diseaseType;
        private Double riskScore;
        private String riskLevel;
        private Double riskTrend;
        private Assessment.AssessmentStatus status;
        private LocalDateTime createdAt;
        private String inputDataJson;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SummaryStats {
        private Integer totalAssessments;
        private String avgRiskLevel;
        private Double avgRiskScore;
        private Map<String, Long> byDiseaseType;
        private Double riskTrendLastMonth;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TrendPoint {
        private String date;
        private Double riskScore;
        private String riskLevel;
    }
}
