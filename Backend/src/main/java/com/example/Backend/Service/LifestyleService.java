package com.example.Backend.Service;

import com.example.Backend.Dto.LifestyleDto;
import com.example.Backend.Repository.UserLifestylePlanRepository;
import com.example.Backend.model.User;
import com.example.Backend.model.UserLifestylePlan;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LifestyleService {

    private final UserLifestylePlanRepository lifestylePlanRepository;

    @Transactional(readOnly = true)
    public LifestyleDto getLifestylePlan(User user) {
        UserLifestylePlan plan = lifestylePlanRepository.findByUser(user)
                .orElseGet(() -> UserLifestylePlan.builder()
                        .user(user)
                        .dietPlanJson(null)
                        .exercisePlanJson(null)
                        .waterGlasses(4)
                        .workoutMinutes(30)
                        .build());

        return LifestyleDto.builder()
                .dietPlanJson(plan.getDietPlanJson())
                .exercisePlanJson(plan.getExercisePlanJson())
                .waterGlasses(plan.getWaterGlasses() != null ? plan.getWaterGlasses() : 4)
                .workoutMinutes(plan.getWorkoutMinutes() != null ? plan.getWorkoutMinutes() : 30)
                .updatedAt(plan.getUpdatedAt())
                .build();
    }

    @Transactional
    public LifestyleDto updateDietPlan(User user, String dietPlanJson, Integer waterGlasses) {
        UserLifestylePlan plan = lifestylePlanRepository.findByUser(user)
                .orElseGet(() -> UserLifestylePlan.builder().user(user).build());

        if (dietPlanJson != null) {
            plan.setDietPlanJson(dietPlanJson);
        }
        if (waterGlasses != null) {
            plan.setWaterGlasses(waterGlasses);
        }

        UserLifestylePlan saved = lifestylePlanRepository.save(plan);
        return getLifestylePlan(user);
    }

    @Transactional
    public LifestyleDto updateExercisePlan(User user, String exercisePlanJson, Integer workoutMinutes) {
        UserLifestylePlan plan = lifestylePlanRepository.findByUser(user)
                .orElseGet(() -> UserLifestylePlan.builder().user(user).build());

        if (exercisePlanJson != null) {
            plan.setExercisePlanJson(exercisePlanJson);
        }
        if (workoutMinutes != null) {
            plan.setWorkoutMinutes(workoutMinutes);
        }

        UserLifestylePlan saved = lifestylePlanRepository.save(plan);
        return getLifestylePlan(user);
    }
}
