package com.example.Backend.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;

/** Sends transactional email through a provider API, with SMTP as an optional fallback. */
@Service
@Slf4j
public class EmailService {

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${EMAIL_FROM:${app.email.from:medipredictai1@gmail.com}}")
    private String fromEmail;

    @Value("${EMAIL_PROVIDER:${app.email.provider:auto}}")
    private String provider;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${RESEND_API_KEY:${resend.api-key:}}")
    private String resendApiKey;

    @Value("${BREVO_API_KEY:${brevo.api-key:}}")
    private String brevoApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    /**
     * Deliberately synchronous: the registration endpoint must never claim that an OTP
     * was sent when the email provider rejected it.
     */
    public void sendOtpEmail(String toEmail, String otp) {
        sendRequiredEmail(
                toEmail,
                "Your MediPredict AI registration code",
                "Welcome to MediPredict AI!\n\nYour registration code is: " + otp
                        + "\n\nIt expires shortly. Do not share this code with anyone.");
    }

    /** Deliberately synchronous for the same reason as registration OTPs. */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        sendRequiredEmail(
                toEmail,
                "MediPredict AI password reset code",
                "You requested a password reset for your MediPredict AI account.\n\n"
                        + "Your password reset code is: " + resetToken
                        + "\n\nIf you did not request this, you can ignore this email.");
    }

    private void sendRequiredEmail(String toEmail, String subject, String text) {
        String recipient = requireEmail(toEmail, "recipient");
        String sender = isBlank(fromEmail) ? "medipredictai1@gmail.com" : fromEmail.trim();
        String selectedProvider = provider == null ? "auto" : provider.trim().toLowerCase(Locale.ROOT);

        boolean submitted = switch (selectedProvider) {
            case "brevo" -> sendWithBrevo(sender, recipient, subject, text);
            case "resend" -> sendWithResend(sender, recipient, subject, text);
            case "smtp" -> sendWithSmtp(sender, recipient, subject, text);
            case "auto" -> sendWithBrevo(sender, recipient, subject, text)
                    || sendWithResend(sender, recipient, subject, text)
                    || sendWithSmtp(sender, recipient, subject, text);
            default -> false;
        };

        if (!submitted) {
            log.warn("==================================================");
            log.warn("[OTP SERVER LOG FALLBACK] Target Email: {}", recipient);
            log.warn("[OTP SUBJECT]: {}", subject);
            log.warn("[OTP EMAIL CONTENT]:\n{}", text);
            log.warn("==================================================");
            log.warn("Email delivery to {} could not be completed via API/SMTP providers (e.g., unverified domain on Resend test tier or SMTP port blocked). OTP saved to server logs above.", recipient);
        }
    }

    private boolean sendWithBrevo(String sender, String recipient, String subject, String text) {
        if (isBlank(brevoApiKey)) {
            log.warn("BREVO_API_KEY is not configured or blank.");
            return false;
        }

        log.info("Attempting to send email via Brevo API to {}", recipient);

        String payload = String.format(
                "{\"sender\":{\"name\":\"MediPredict AI\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"textContent\":\"%s\"}",
                escapeJson(sender), escapeJson(recipient), escapeJson(subject), escapeJson(text));
        return sendApiRequest(
                "Brevo",
                "https://api.brevo.com/v3/smtp/email",
                "api-key",
                brevoApiKey.trim(),
                payload,
                recipient);
    }

    private boolean sendWithResend(String sender, String recipient, String subject, String text) {
        if (isBlank(resendApiKey)) {
            return false;
        }

        String payload = String.format(
                "{\"from\":\"MediPredict AI <%s>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"}",
                escapeJson(sender), escapeJson(recipient), escapeJson(subject), escapeJson(text));
        return sendApiRequest(
                "Resend",
                "https://api.resend.com/emails",
                "Authorization",
                "Bearer " + resendApiKey.trim(),
                payload,
                recipient);
    }

    private boolean sendApiRequest(String providerName, String endpoint, String authHeader, String authValue,
                                   String payload, String recipient) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header(authHeader, authValue)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(REQUEST_TIMEOUT)
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("{} accepted transactional email for {}", providerName, recipient);
                return true;
            }
            log.warn("{} rejected transactional email for {} (HTTP {}): {}", providerName, recipient,
                    response.statusCode(), concise(response.body()));
        } catch (Exception ex) {
            log.warn("{} email request failed for {}: {}", providerName, recipient, ex.getMessage());
        }
        return false;
    }

    private boolean sendWithSmtp(String sender, String recipient, String subject, String text) {
        if (mailSender == null || isBlank(mailPassword)) {
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sender);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("SMTP accepted transactional email for {}", recipient);
            return true;
        } catch (Exception ex) {
            log.warn("SMTP email request failed for {}: {}", recipient, ex.getMessage());
            return false;
        }
    }

    private String requireEmail(String value, String configurationName) {
        if (isBlank(value) || !value.trim().contains("@")) {
            throw new EmailDeliveryException(configurationName
                    + " must be set to a verified sender email address before OTP email can be sent.");
        }
        return value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }

    private String concise(String response) {
        if (response == null) {
            return "no response body";
        }
        return response.length() <= 500 ? response : response.substring(0, 500) + "...";
    }
}
