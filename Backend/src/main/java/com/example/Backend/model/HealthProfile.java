package com.example.Backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Vitals
    private Double height;         // cm
    private Double weight;         // kg
    private Double bmi;
    private Double glucoseLevel;   // mg/dL
    private Integer bloodPressureSystolic;
    private Integer bloodPressureDiastolic;
    private Double insulinLevel;   // μU/mL
    private Integer heartRate;

    // Lifestyle
    private String smokingStatus;
    private String alcoholConsumption;
    private String physicalActivityLevel;
    private String dietType;

    // Medical History
    private String existingConditions;
    private String currentMedications;
    private String familyHistory;
    private String allergies;

    // Aggregated Stats
    @Builder.Default
    private Integer totalAssessments = 0;
    private String avgRiskLevel;
    private LocalDateTime nextCheckupDate;

    @LastModifiedDate
    private LocalDateTime lastUpdated;
}
