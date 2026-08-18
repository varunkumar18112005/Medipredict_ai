package com.example.Backend.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:${SPRING_MAIL_USERNAME:medipredictai1@gmail.com}}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Sending OTP email to: {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Your MediPredict AI Registration OTP");
            message.setText("Welcome to MediPredict AI!\n\nYour OTP for registration is: " + otp
                    + "\n\nPlease enter this code to verify your email address.\n\nDo not share this OTP with anyone.");
            mailSender.send(message);
            log.info("OTP email sent successfully via SMTP to {}", toEmail);
        } catch (Exception e) {
            log.warn("SMTP email send failed for {}: {}. OTP generated: [{}]", toEmail, e.getMessage(), otp);
            // Do not throw Exception so registration flow proceeds smoothly even if cloud firewall blocks outbound SMTP port 587
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        log.info("Sending password reset email to: {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("MediPredict AI - Password Reset OTP");
            message.setText("You requested a password reset for your MediPredict AI account.\n\n"
                    + "Your 6-digit password reset OTP is:\n\n"
                    + resetToken + "\n\n"
                    + "Please enter this code on the password reset page to change your password.\n\n"
                    + "If you did not request this, please ignore this email.\nThis OTP will expire in 1 hour.");
            mailSender.send(message);
            log.info("Password reset email sent successfully via SMTP to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send password reset email via SMTP to {}. Using server log fallback. Reset OTP: [{}]. Error: {}", toEmail, resetToken, e.getMessage());
            // Do not throw RuntimeException so reset flow is not blocked by SMTP connection timeouts
        }
    }
}
