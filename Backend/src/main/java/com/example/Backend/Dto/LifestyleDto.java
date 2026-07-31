package com.example.Backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LifestyleDto {
    private String dietPlanJson;
    private String exercisePlanJson;
    private Integer waterGlasses;
    private Integer workoutMinutes;
    private LocalDateTime updatedAt;
}
