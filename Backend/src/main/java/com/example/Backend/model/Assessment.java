package com.example.Backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessments")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiseaseType diseaseType;

    // Input data (stored as JSON string for flexibility)
    @Column(columnDefinition = "TEXT")
    private String inputDataJson;

    // Results
    private Double riskScore;           // 0.0 - 100.0
    private String riskLevel;           // LOW, MODERATE, HIGH, CRITICAL
    private Double previousRiskScore;
    private Double riskTrend;           // % change from last assessment

    @Column(columnDefinition = "TEXT")
    private String riskFactorsJson;     // JSON array of risk factors

    @Column(columnDefinition = "TEXT")
    private String suggestionsJson;     // JSON array of health suggestions

    @Column(columnDefinition = "TEXT")
    private String aiAnalysisJson;      // Full AI analysis output

    // Report file
    private String reportFilePath;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AssessmentStatus status = AssessmentStatus.PENDING;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    public enum DiseaseType {
        DIABETES, HEART_DISEASE, LIVER_DISEASE, KIDNEY_DISEASE, THYROID_DISEASE, PULMONARY_DISEASE, STROKE, ANEMIA, FULL_SCAN
    }

    public enum AssessmentStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
