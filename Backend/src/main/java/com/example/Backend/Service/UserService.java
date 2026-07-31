package com.example.Backend.Service;

import com.example.Backend.Dto.UserDto;
import com.example.Backend.model.HealthProfile;
import com.example.Backend.model.User;
import com.example.Backend.Repository.AssessmentRepository;
import com.example.Backend.Repository.HealthProfileRepository;
import com.example.Backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final AssessmentRepository assessmentRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // ── Get Profile ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDto.ProfileResponse getProfile(String email) {
        User user = findUser(email);
        return toProfileResponse(user);
    }

    // ── Update Profile ────────────────────────────────────────────────

    public UserDto.ProfileResponse updateProfile(String email, UserDto.UpdateProfileRequest req) {
        User user = findUser(email);

        if (req.getFirstName() != null)
            user.setFirstName(req.getFirstName());
        if (req.getLastName() != null)
            user.setLastName(req.getLastName());
        if (req.getDateOfBirth() != null)
            user.setDateOfBirth(req.getDateOfBirth());
        if (req.getGender() != null)
            user.setGender(req.getGender());

        if (req.getEmail() != null && !req.getEmail().equals(email)) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new IllegalArgumentException("Email already in use: " + req.getEmail());
            }
            user.setEmail(req.getEmail().toLowerCase());
        }

        return toProfileResponse(userRepository.save(user));
    }

    // ── Upload Avatar ─────────────────────────────────────────────────

    public String uploadAvatar(String email, MultipartFile file) {
        User user = findUser(email);
        validateImageFile(file);

        try {
            Path dir = Paths.get(uploadDir, "avatars");
            Files.createDirectories(dir);

            String ext = getExtension(file.getOriginalFilename());
            String filename = "avatar_" + user.getId() + "_" + UUID.randomUUID() + ext;
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String url = "/uploads/avatars/" + filename;
            user.setProfilePictureUrl(url);
            userRepository.save(user);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar", e);
        }
    }

    // ── Health Profile ────────────────────────────────────────────────

    public UserDto.HealthProfileResponse getHealthProfile(String email) {
        User user = findUser(email);
        HealthProfile hp = healthProfileRepository.findByUser(user)
                .orElseGet(() -> createEmptyHealthProfile(user));
        return toHealthProfileResponse(hp);
    }

    public UserDto.HealthProfileResponse updateHealthProfile(
            String email, UserDto.UpdateHealthProfileRequest req) {
        User user = findUser(email);
        HealthProfile hp = healthProfileRepository.findByUser(user)
                .orElseGet(() -> createEmptyHealthProfile(user));

        if (req.getHeight() != null)
            hp.setHeight(req.getHeight());
        if (req.getWeight() != null)
            hp.setWeight(req.getWeight());
        if (req.getGlucoseLevel() != null)
            hp.setGlucoseLevel(req.getGlucoseLevel());
        if (req.getBloodPressureSystolic() != null)
            hp.setBloodPressureSystolic(req.getBloodPressureSystolic());
        if (req.getBloodPressureDiastolic() != null)
            hp.setBloodPressureDiastolic(req.getBloodPressureDiastolic());
        if (req.getInsulinLevel() != null)
            hp.setInsulinLevel(req.getInsulinLevel());
        if (req.getHeartRate() != null)
            hp.setHeartRate(req.getHeartRate());
        if (req.getSmokingStatus() != null)
            hp.setSmokingStatus(req.getSmokingStatus());
        if (req.getAlcoholConsumption() != null)
            hp.setAlcoholConsumption(req.getAlcoholConsumption());
        if (req.getPhysicalActivityLevel() != null)
            hp.setPhysicalActivityLevel(req.getPhysicalActivityLevel());
        if (req.getDietType() != null)
            hp.setDietType(req.getDietType());
        if (req.getExistingConditions() != null)
            hp.setExistingConditions(req.getExistingConditions());
        if (req.getCurrentMedications() != null)
            hp.setCurrentMedications(req.getCurrentMedications());
        if (req.getFamilyHistory() != null)
            hp.setFamilyHistory(req.getFamilyHistory());
        if (req.getAllergies() != null)
            hp.setAllergies(req.getAllergies());

        // Recalculate BMI
        if (hp.getHeight() != null && hp.getWeight() != null && hp.getHeight() > 0) {
            double heightM = hp.getHeight() / 100.0;
            hp.setBmi(Math.round((hp.getWeight() / (heightM * heightM)) * 10.0) / 10.0);
        }

        return toHealthProfileResponse(healthProfileRepository.save(hp));
    }

    // ── Stats (Profile Screen) ────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDto.StatsResponse getStats(String email) {
        User user = findUser(email);

        long total = assessmentRepository.countCompletedByUser(user);
        Double avgRisk = assessmentRepository.findAvgRiskScoreByUser(user);

        HealthProfile hp = healthProfileRepository.findByUser(user).orElse(null);

        LocalDateTime nextCheckupDateTime = hp != null ? hp.getNextCheckupDate() : null;
        String nextCheckupIn = "";
        if (nextCheckupDateTime != null) {
            long daysUntil = ChronoUnit.DAYS.between(
                    LocalDate.now(), nextCheckupDateTime.toLocalDate());
            nextCheckupIn = daysUntil >= 0
                    ? "In " + daysUntil + " day" + (daysUntil == 1 ? "" : "s")
                    : "Overdue";
        }

        String avgRiskLevel = riskLevel(avgRisk);

        return UserDto.StatsResponse.builder()
                .avgRiskLevel(avgRiskLevel)
                .avgRiskScore(avgRisk != null ? Math.round(avgRisk * 10.0) / 10.0 : null)
                .totalAssessments((int) total)
                .nextCheckupDate(nextCheckupDateTime)
                .nextCheckupIn(nextCheckupIn)
                .build();
    }

    // ── Delete Account ────────────────────────────────────────────────

    public void deleteAccount(String email) {
        User user = findUser(email);
        userRepository.delete(user);
        log.info("Account deleted: {}", email);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    private HealthProfile createEmptyHealthProfile(User user) {
        HealthProfile hp = HealthProfile.builder().user(user).build();
        return healthProfileRepository.save(hp);
    }

    private UserDto.ProfileResponse toProfileResponse(User u) {
        return UserDto.ProfileResponse.builder()
                .id(u.getId())
                .healthId(u.getHealthId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .dateOfBirth(u.getDateOfBirth())
                .gender(u.getGender())
                .role(u.getRole().name())
                .status(u.getStatus().name())
                .profilePictureUrl(u.getProfilePictureUrl())
                .emailVerified(u.isEmailVerified())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    private UserDto.HealthProfileResponse toHealthProfileResponse(HealthProfile hp) {
        return UserDto.HealthProfileResponse.builder()
                .id(hp.getId())
                .height(hp.getHeight())
                .weight(hp.getWeight())
                .bmi(hp.getBmi())
                .glucoseLevel(hp.getGlucoseLevel())
                .bloodPressureSystolic(hp.getBloodPressureSystolic())
                .bloodPressureDiastolic(hp.getBloodPressureDiastolic())
                .insulinLevel(hp.getInsulinLevel())
                .heartRate(hp.getHeartRate())
                .smokingStatus(hp.getSmokingStatus())
                .alcoholConsumption(hp.getAlcoholConsumption())
                .physicalActivityLevel(hp.getPhysicalActivityLevel())
                .dietType(hp.getDietType())
                .existingConditions(hp.getExistingConditions())
                .currentMedications(hp.getCurrentMedications())
                .familyHistory(hp.getFamilyHistory())
                .allergies(hp.getAllergies())
                .totalAssessments(hp.getTotalAssessments())
                .avgRiskLevel(hp.getAvgRiskLevel())
                .nextCheckupDate(hp.getNextCheckupDate())
                .lastUpdated(hp.getLastUpdated())
                .build();
    }

    private String riskLevel(Double score) {
        if (score == null)
            return "Unknown";
        if (score < 25)
            return "Low";
        if (score < 50)
            return "Moderate";
        if (score < 75)
            return "High";
        return "Critical";
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File is empty");
        String ct = file.getContentType();
        if (ct == null || (!ct.startsWith("image/"))) {
            throw new IllegalArgumentException("Only image files are allowed for avatars");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Avatar file must be under 5MB");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
