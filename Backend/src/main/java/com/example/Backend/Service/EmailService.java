package com.example.Backend.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:${SPRING_MAIL_USERNAME:medipredictai1@gmail.com}}")
    private String fromEmail;

    @Value("${spring.mail.password:${SPRING_MAIL_PASSWORD:}}")
    private String mailPassword;

    @Value("${resend.api-key:${RESEND_API_KEY:${EMAIL_API_KEY:}}}")
    private String resendApiKey;

    @Value("${brevo.api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Sending OTP email to: {}", toEmail);
        String subject = "Your MediPredict AI Registration OTP";
        String bodyText = "Welcome to MediPredict AI!\n\nYour OTP for registration is: " + otp
                + "\n\nPlease enter this code to verify your email address.\n\nDo not share this OTP with anyone.";

        // 1. Try HTTPS API (Port 443 - Recommended for Cloud Hosts like Render)
        if (tryHttpApiSending(toEmail, subject, bodyText, otp)) {
            return;
        }

        // 2. Try SMTP only if password is provided
        if (mailSender != null && mailPassword != null && !mailPassword.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(bodyText);
                mailSender.send(message);
                log.info("OTP email sent successfully via SMTP to {}", toEmail);
                return;
            } catch (Exception e) {
                log.warn("SMTP email send failed for {}: {}. Falling back to server log. OTP: [{}]", toEmail, e.getMessage(), otp);
            }
        } else {
            log.info("No SMTP password set. Skipping raw SMTP socket connection.");
        }

        // 3. Server Log Fallback
        log.info("==================================================");
        log.info("[OTP SERVER LOG FALLBACK] Target Email: {}", toEmail);
        log.info("[OTP CODE]: {}", otp);
        log.info("==================================================");
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        log.info("Sending password reset email to: {}", toEmail);
        String subject = "MediPredict AI - Password Reset OTP";
        String bodyText = "You requested a password reset for your MediPredict AI account.\n\n"
                + "Your 6-digit password reset OTP is:\n\n"
                + resetToken + "\n\n"
                + "Please enter this code on the password reset page to change your password.\n\n"
                + "If you did not request this, please ignore this email.\nThis OTP will expire in 1 hour.";

        if (tryHttpApiSending(toEmail, subject, bodyText, resetToken)) {
            return;
        }

        if (mailSender != null && mailPassword != null && !mailPassword.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(bodyText);
                mailSender.send(message);
                log.info("Password reset email sent successfully via SMTP to {}", toEmail);
                return;
            } catch (Exception e) {
                log.warn("Failed to send password reset email via SMTP to {}. Reset OTP: [{}]. Error: {}", toEmail, resetToken, e.getMessage());
            }
        }

        log.info("==================================================");
        log.info("[RESET OTP SERVER LOG FALLBACK] Target Email: {}", toEmail);
        log.info("[RESET OTP CODE]: {}", resetToken);
        log.info("==================================================");
    }

    private boolean tryHttpApiSending(String toEmail, String subject, String bodyText, String code) {
        // Option A: Resend API (HTTPS Port 443)
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            try {
                String cleanApiKey = resendApiKey.trim();
                log.info("Attempting to send email via Resend API (Key length: {}) to {}", cleanApiKey.length(), toEmail);

                String jsonPayload = String.format(
                        "{\"from\":\"onboarding@resend.dev\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"}",
                        escapeJson(toEmail), escapeJson(subject), escapeJson(bodyText)
                );

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.resend.com/emails"))
                        .header("Authorization", "Bearer " + cleanApiKey)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .timeout(Duration.ofSeconds(8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ OTP email successfully delivered to {} via Resend HTTP API (Port 443)! Response: {}", toEmail, response.body());
                    return true;
                } else {
                    log.warn("❌ Resend HTTP API returned HTTP status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("❌ Resend HTTP API exception: {}", e.getMessage(), e);
            }
        } else {
            log.info("RESEND_API_KEY is empty or not set.");
        }

        // Option B: Brevo API (HTTPS Port 443)
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            try {
                String cleanApiKey = brevoApiKey.trim();
                log.info("Attempting to send email via Brevo API to {}", toEmail);

                String jsonPayload = String.format(
                        "{\"sender\":{\"name\":\"MediPredict AI\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"textContent\":\"%s\"}",
                        escapeJson(fromEmail), escapeJson(toEmail), escapeJson(subject), escapeJson(bodyText)
                );

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                        .header("api-key", cleanApiKey)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .timeout(Duration.ofSeconds(8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ OTP email successfully delivered to {} via Brevo HTTP API (Port 443)! Response: {}", toEmail, response.body());
                    return true;
                } else {
                    log.warn("❌ Brevo HTTP API returned HTTP status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("❌ Brevo HTTP API exception: {}", e.getMessage(), e);
            }
        }

        return false;
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\r", "")
                    .replace("\n", "\\n")
                    .replace("\t", "\\t");
    }
}
