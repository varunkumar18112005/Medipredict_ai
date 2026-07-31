package com.example.Backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_lifestyle_plans")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLifestylePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String dietPlanJson;

    @Column(columnDefinition = "TEXT")
    private String exercisePlanJson;

    @Builder.Default
    private Integer waterGlasses = 4;

    @Builder.Default
    private Integer workoutMinutes = 30;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
