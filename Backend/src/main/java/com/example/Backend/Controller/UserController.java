package com.example.Backend.Controller;

import com.example.Backend.Dto.UserDto;
import com.example.Backend.Service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and health profile management")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserDto.ProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getProfile(userDetails.getUsername()));
    }

    @PutMapping("/me")
    @Operation(summary = "Update personal information")
    public ResponseEntity<UserDto.ProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserDto.UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getUsername(), request));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload profile picture")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String url = userService.uploadAvatar(userDetails.getUsername(), file);
        return ResponseEntity.ok(Map.of("profilePictureUrl", url));
    }

    @GetMapping("/me/health-profile")
    @Operation(summary = "Get health profile — vitals, BMI, lifestyle")
    public ResponseEntity<UserDto.HealthProfileResponse> getHealthProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getHealthProfile(userDetails.getUsername()));
    }

    @PutMapping("/me/health-profile")
    @Operation(summary = "Update health profile")
    public ResponseEntity<UserDto.HealthProfileResponse> updateHealthProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserDto.UpdateHealthProfileRequest request) {
        return ResponseEntity.ok(
                userService.updateHealthProfile(userDetails.getUsername(), request));
    }

    @GetMapping("/me/stats")
    @Operation(summary = "Get health stats summary shown on profile screen")
    public ResponseEntity<UserDto.StatsResponse> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getStats(userDetails.getUsername()));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete account permanently")
    public ResponseEntity<Map<String, String>> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteAccount(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
