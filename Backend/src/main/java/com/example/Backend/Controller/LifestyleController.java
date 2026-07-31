package com.example.Backend.Controller;

import com.example.Backend.Dto.LifestyleDto;
import com.example.Backend.Repository.UserRepository;
import com.example.Backend.Service.LifestyleService;
import com.example.Backend.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/lifestyle")
@RequiredArgsConstructor
@Slf4j
public class LifestyleController {

    private final LifestyleService lifestyleService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Optional<User> getUser(UserDetails userDetails) {
        if (userDetails == null || userDetails.getUsername() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(userDetails.getUsername());
    }

    private String extractJson(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String str) return str;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }

    @GetMapping("/plan")
    public ResponseEntity<LifestyleDto> getLifestylePlan(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Optional<User> userOpt = getUser(userDetails);
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(LifestyleDto.builder()
                        .dietPlanJson(null)
                        .exercisePlanJson(null)
                        .waterGlasses(4)
                        .workoutMinutes(30)
                        .build());
            }
            return ResponseEntity.ok(lifestyleService.getLifestylePlan(userOpt.get()));
        } catch (Exception e) {
            log.warn("Error fetching lifestyle plan: {}", e.getMessage());
            return ResponseEntity.ok(LifestyleDto.builder()
                    .dietPlanJson(null)
                    .exercisePlanJson(null)
                    .waterGlasses(4)
                    .workoutMinutes(30)
                    .build());
        }
    }

    @PostMapping("/diet")
    public ResponseEntity<LifestyleDto> updateDietPlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        try {
            Optional<User> userOpt = getUser(userDetails);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).build();
            }
            String dietPlanJson = extractJson(body.get("dietPlanJson"));
            Integer waterGlasses = body.containsKey("waterGlasses") && body.get("waterGlasses") != null
                    ? Integer.parseInt(body.get("waterGlasses").toString())
                    : null;

            return ResponseEntity.ok(lifestyleService.updateDietPlan(userOpt.get(), dietPlanJson, waterGlasses));
        } catch (Exception e) {
            log.error("Error updating diet plan: {}", e.getMessage(), e);
            return ResponseEntity.ok(LifestyleDto.builder().build());
        }
    }

    @PostMapping("/exercise")
    public ResponseEntity<LifestyleDto> updateExercisePlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        try {
            Optional<User> userOpt = getUser(userDetails);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).build();
            }
            String exercisePlanJson = extractJson(body.get("exercisePlanJson"));
            Integer workoutMinutes = body.containsKey("workoutMinutes") && body.get("workoutMinutes") != null
                    ? Integer.parseInt(body.get("workoutMinutes").toString())
                    : null;

            return ResponseEntity.ok(lifestyleService.updateExercisePlan(userOpt.get(), exercisePlanJson, workoutMinutes));
        } catch (Exception e) {
            log.error("Error updating exercise plan: {}", e.getMessage(), e);
            return ResponseEntity.ok(LifestyleDto.builder().build());
        }
    }
}


