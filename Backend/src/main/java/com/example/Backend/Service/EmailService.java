package com.example.Backend.Service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;

/** Sends transactional HTML email through Brevo / Resend API or SMTP fallback. */
@Service
@Slf4j
public class EmailService {

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${EMAIL_FROM:${app.email.from:medipredictai1@gmail.com}}")
    private String fromEmail;

    @Value("${EMAIL_PROVIDER:${app.email.provider:brevo}}")
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

    public void sendOtpEmail(String toEmail, String otp) {
        String subject = "Your MediPredict AI Registration Code";
        String htmlContent = buildHtmlTemplate(
                "Welcome to MediPredict AI!",
                "Thank you for signing up. Please use the verification code below to verify your email address and complete your account creation.",
                otp,
                "This verification code expires in 15 minutes. Do not share this code with anyone for your account security."
        );
        String plainText = "Welcome to MediPredict AI!\n\nYour registration code is: " + otp
                + "\n\nIt expires in 15 minutes. Do not share this code with anyone.";
        
        sendRequiredEmail(toEmail, subject, htmlContent, plainText);
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String subject = "MediPredict AI Password Reset Code";
        String htmlContent = buildHtmlTemplate(
                "Reset Your Password",
                "You requested a password reset for your MediPredict AI account. Please use the security code below to set a new password.",
                resetToken,
                "This password reset code expires in 1 hour. If you did not request a password reset, you can safely ignore this email."
        );
        String plainText = "You requested a password reset for your MediPredict AI account.\n\n"
                + "Your password reset code is: " + resetToken
                + "\n\nIf you did not request this, you can ignore this email.";

        sendRequiredEmail(toEmail, subject, htmlContent, plainText);
    }

    private void sendRequiredEmail(String toEmail, String subject, String htmlContent, String plainText) {
        String recipient = requireEmail(toEmail, "recipient");
        String sender = isBlank(fromEmail) ? "medipredictai1@gmail.com" : fromEmail.trim();
        String selectedProvider = provider == null ? "brevo" : provider.trim().toLowerCase(Locale.ROOT);

        boolean submitted = switch (selectedProvider) {
            case "brevo" -> sendWithBrevo(sender, recipient, subject, htmlContent);
            case "resend" -> sendWithResend(sender, recipient, subject, htmlContent);
            case "smtp" -> sendWithSmtp(sender, recipient, subject, htmlContent, plainText);
            case "auto" -> sendWithBrevo(sender, recipient, subject, htmlContent)
                    || sendWithResend(sender, recipient, subject, htmlContent)
                    || sendWithSmtp(sender, recipient, subject, htmlContent, plainText);
            default -> false;
        };

        if (!submitted) {
            log.warn("==================================================");
            log.warn("[OTP SERVER LOG FALLBACK] Target Email: {}", recipient);
            log.warn("[OTP SUBJECT]: {}", subject);
            log.warn("[OTP CONTENT]:\n{}", plainText);
            log.warn("==================================================");
            log.warn("Email delivery to {} could not be completed via provider '{}'. OTP saved to server logs above.", recipient, selectedProvider);
        }
    }

    private boolean sendWithBrevo(String sender, String recipient, String subject, String htmlContent) {
        if (isBlank(brevoApiKey)) {
            log.warn("Brevo API Key is not configured or blank. Please check BREVO_API_KEY on Render.");
            return false;
        }

        log.info("Sending HTML email via Brevo API to {} (Sender: {})", recipient, sender);

        String payload = String.format(
                "{\"sender\":{\"name\":\"MediPredict AI\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"htmlContent\":\"%s\"}",
                escapeJson(sender), escapeJson(recipient), escapeJson(subject), escapeJson(htmlContent));
        return sendApiRequest(
                "Brevo",
                "https://api.brevo.com/v3/smtp/email",
                "api-key",
                brevoApiKey.trim(),
                payload,
                recipient);
    }

    private boolean sendWithResend(String sender, String recipient, String subject, String htmlContent) {
        if (isBlank(resendApiKey)) {
            return false;
        }

        String payload = String.format(
                "{\"from\":\"MediPredict AI <%s>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                escapeJson(sender), escapeJson(recipient), escapeJson(subject), escapeJson(htmlContent));
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
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(REQUEST_TIMEOUT)
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ {} accepted transactional HTML email for {}", providerName, recipient);
                return true;
            }
            log.error("❌ {} rejected transactional email for {} (HTTP {}): {}", providerName, recipient,
                    response.statusCode(), response.body());
        } catch (Exception ex) {
            log.error("❌ {} email request failed for {}: {}", providerName, recipient, ex.getMessage(), ex);
        }
        return false;
    }

    private boolean sendWithSmtp(String sender, String recipient, String subject, String htmlContent, String plainText) {
        if (mailSender == null || isBlank(mailPassword)) {
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(sender);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("SMTP accepted transactional HTML email for {}", recipient);
            return true;
        } catch (Exception ex) {
            log.warn("SMTP email request failed for {}: {}", recipient, ex.getMessage());
            return false;
        }
    }

    private String buildHtmlTemplate(String title, String description, String code, String note) {
        return "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap\" rel=\"stylesheet\">"
                + "<style>"
                + "* { box-sizing: border-box; }"
                + "body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; }"
                + ".wrapper { width: 100%; table-layout: fixed; background-color: #f4f5f7; padding: 40px 10px; }"
                + ".main { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(4,11,34,0.08); border: 1px solid #e5e7eb; }"
                + ".header-bar { background-color: #040b22; padding: 28px 20px; text-align: center; color: #ffffff; }"
                + ".logo-text { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff; margin: 0; }"
                + ".logo-sub { font-size: 12px; font-weight: 400; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; }"
                + ".content-body { padding: 40px 32px; text-align: center; color: #040b22; }"
                + ".heading { font-size: 28px; font-weight: 700; line-height: 1.25; margin: 0 0 16px 0; color: #040b22; letter-spacing: -0.5px; }"
                + ".desc { font-size: 16px; font-weight: 300; line-height: 1.5; color: #4a4f5f; margin: 0 0 32px 0; }"
                + ".code-card { background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px 32px; margin: 0 auto 32px auto; display: inline-block; width: 100%; max-width: 380px; }"
                + ".code-display { font-family: 'Inter', monospace; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #1e40ff; text-align: center; margin: 0; }"
                + ".note-box { background-color: #eff6ff; border-left: 4px solid #1e40ff; padding: 16px 20px; border-radius: 8px; text-align: left; font-size: 14px; color: #1e3a8a; line-height: 1.5; margin-bottom: 24px; }"
                + ".footer-section { background-color: #f5f5f7; padding: 32px 24px; text-align: center; font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #e5e7eb; }"
                + ".footer-section a { color: #1e40ff; text-decoration: none; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"wrapper\">"
                + "<div class=\"main\">"
                + "<div class=\"header-bar\">"
                + "<div class=\"logo-text\">MediPredict AI</div>"
                + "<div class=\"logo-sub\">Healthcare Intelligence Platform</div>"
                + "</div>"
                + "<div class=\"content-body\">"
                + "<div class=\"heading\">" + escapeHtml(title) + "</div>"
                + "<div class=\"desc\">" + escapeHtml(description) + "</div>"
                + "<div class=\"code-card\">"
                + "<div class=\"code-display\">" + escapeHtml(code) + "</div>"
                + "</div>"
                + "<div class=\"note-box\">"
                + "<strong>Note:</strong> " + escapeHtml(note)
                + "</div>"
                + "</div>"
                + "<div class=\"footer-section\">"
                + "<p style=\"margin:0 0 8px 0;\">You received this transactional security code because an account action was initiated at MediPredict AI.</p>"
                + "<p style=\"margin:0;\">&copy; 2026 MediPredict AI Technologies Inc. All rights reserved.</p>"
                + "</div>"
                + "</div>"
                + "</div>"
                + "</body>"
                + "</html>";
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

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
