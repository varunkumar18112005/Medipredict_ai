package com.example.Backend.config;

import com.example.Backend.model.User;
import com.example.Backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedAdminUser() {
        return args -> {
            String adminEmail = "admin@medipredict.ai";
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = User.builder()
                        .firstName("Admin")
                        .lastName("MediPredict")
                        .email(adminEmail)
                        .password(passwordEncoder.encode("Admin@1234"))
                        .healthId("MP-0001")
                        .role(User.Role.ADMIN)
                        .status(User.AccountStatus.ACTIVE)
                        .emailVerified(true)
                        .build();
                userRepository.save(admin);
                log.info("Default admin user created: {} / Admin@1234", adminEmail);
            }
        };
    }
}
