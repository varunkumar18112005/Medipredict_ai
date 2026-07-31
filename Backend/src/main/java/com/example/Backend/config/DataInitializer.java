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

            String demoEmail = "user@gmail.com";
            if (!userRepository.existsByEmail(demoEmail)) {
                User user = User.builder()
                        .firstName("Demo")
                        .lastName("User")
                        .email(demoEmail)
                        .password(passwordEncoder.encode("User@1234"))
                        .healthId("MP-0002")
                        .role(User.Role.USER)
                        .status(User.AccountStatus.ACTIVE)
                        .emailVerified(true)
                        .build();
                userRepository.save(user);
                log.info("Default demo user created: {} / User@1234", demoEmail);
            }

            String testEmail = "test@gmail.com";
            if (!userRepository.existsByEmail(testEmail)) {
                User testUser = User.builder()
                        .firstName("Test")
                        .lastName("User")
                        .email(testEmail)
                        .password(passwordEncoder.encode("Test@1234"))
                        .healthId("MP-0003")
                        .role(User.Role.USER)
                        .status(User.AccountStatus.ACTIVE)
                        .emailVerified(true)
                        .build();
                userRepository.save(testUser);
                log.info("Default test user created: {} / Test@1234", testEmail);
            }
        };
    }
}
