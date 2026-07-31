package com.example.Backend.Service;

import com.example.Backend.Dto.AuthDto;
import com.example.Backend.model.User;
import com.example.Backend.Repository.UserRepository;
import com.example.Backend.Security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final OtpService otpService;
    private final EmailService emailService;

    // ── Register ──────────────────────────────────────────────────────

    public void initiateRegistration(AuthDto.RegisterRequest request) {
        if (!request.getEmail().toLowerCase().endsWith("@gmail.com")) {
            throw new IllegalArgumentException("Only @gmail.com addresses are allowed");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }
        String otp = otpService.generateOtp(request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), otp);
    }

    public AuthDto.AuthResponse verifyRegistration(AuthDto.VerifyOtpRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .healthId(generateHealthId())
                .role(User.Role.USER)
                .status(User.AccountStatus.ACTIVE)
                .emailVerified(true) // OTP served as email verification
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {} ({})", user.getEmail(), user.getHealthId());

        return buildAuthResponse(user);
    }

    // ── Login ─────────────────────────────────────────────────────────

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()));

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── Google Login ──────────────────────────────────────────────────

    public AuthDto.AuthResponse googleLogin(AuthDto.GoogleLoginRequest request) {
        if (!request.getEmail().toLowerCase().endsWith("@gmail.com")) {
            throw new IllegalArgumentException("Only @gmail.com addresses are allowed");
        }

        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .firstName(request.getFirstName())
                            .lastName(request.getLastName())
                            .email(email)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .healthId(generateHealthId())
                            .role(User.Role.USER)
                            .status(User.AccountStatus.ACTIVE)
                            .emailVerified(true)
                            .profilePictureUrl(request.getProfilePictureUrl())
                            .build();
                    log.info("New Google user registered automatically: {}", email);
                    return userRepository.save(newUser);
                });

        if (request.getProfilePictureUrl() != null && user.getProfilePictureUrl() == null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
            user = userRepository.save(user);
        }

        log.info("Google user logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── Refresh Token ────────────────────────────────────────────────

    public AuthDto.AuthResponse refreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        if (!jwtUtils.isTokenValid(refreshToken, userDetails)) {
            throw new IllegalArgumentException("Refresh token expired or invalid");
        }

        return buildAuthResponse(user);
    }

    // ── Logout ────────────────────────────────────────────────────────

    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
        log.info("User logged out: {}", email);
    }

    // ── Forgot / Reset Password ───────────────────────────────────────

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = String.format("%06d", new Random().nextInt(1000000));
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        // FALLBACK: Print OTP to console for local development
        System.out.println("\n=======================================================");
        System.out.println("              DEVELOPMENT RESET OTP                    ");
        System.out.println("=======================================================");
        System.out.println("Email: " + email);
        System.out.println("OTP: " + token);
        System.out.println("=======================================================\n");

        emailService.sendPasswordResetEmail(email, token);
        log.info("Password reset OTP generated and email sent for: {}", email);
    }

    public void resetPassword(AuthDto.ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset OTP"));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset OTP has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
        log.info("Password reset for: {}", user.getEmail());
    }

    // ── Change Password ───────────────────────────────────────────────

    public void changePassword(String email, AuthDto.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for: {}", email);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private AuthDto.AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        String accessToken = jwtUtils.generateToken(userDetails);
        String refreshToken = jwtUtils.generateRefreshToken(userDetails);

        // Persist refresh token
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return AuthDto.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getExpirationMs())
                .user(toUserSummary(user))
                .build();
    }

    private AuthDto.UserSummary toUserSummary(User user) {
        return AuthDto.UserSummary.builder()
                .id(user.getId())
                .healthId(user.getHealthId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String generateHealthId() {
        String id;
        do {
            id = "MP-" + (1000 + new Random().nextInt(9000));
        } while (userRepository.findByHealthId(id).isPresent());
        return id;
    }
}
