package com.example.Backend.Service;

import com.example.Backend.Dto.ReportDto;
import com.example.Backend.model.Assessment;
import com.example.Backend.model.MedicalReport;
import com.example.Backend.model.User;
import com.example.Backend.Repository.AssessmentRepository;
import com.example.Backend.Repository.MedicalReportRepository;
import com.example.Backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.ByteArrayResource;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReportService {

    private final MedicalReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AssessmentRepository assessmentRepository;

    // BUG FIX 1: Inject a shared RestTemplate bean instead of creating
    // a new instance on every upload call. Register RestTemplate as a
    // @Bean in your Spring config class:
    //
    //   @Bean
    //   public RestTemplate restTemplate() { return new RestTemplate(); }
    //
    private final RestTemplate restTemplate;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // BUG FIX 2: ML service URL is now configurable via application.properties
    // so it works both in Docker (ml-service:8000) and locally (localhost:8000).
    // Add to application.properties:
    //   app.ml.service.url=http://localhost:8000          # local dev
    //   app.ml.service.url=http://ml-service:8000         # docker-compose
    @Value("${app.ml.service.url:http://ml-service:8000}")
    private String mlServiceUrl;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp");
    private static final long MAX_SIZE = 10L * 1024 * 1024;

    // ── Upload ────────────────────────────────────────────────────────

    public ReportDto.Response upload(String email, MultipartFile file, Long assessmentId) {
        User user = findUser(email);
        validate(file);

        try {
            Path dir = Paths.get(uploadDir, "reports", user.getId().toString());
            Files.createDirectories(dir);

            String ext = getExtension(file.getOriginalFilename());
            String storedName = UUID.randomUUID() + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            Assessment assessment = null;
            if (assessmentId != null) {
                assessment = assessmentRepository.findByIdAndUser(assessmentId, user)
                        .orElse(null);
            }

            MedicalReport report = MedicalReport.builder()
                    .user(user)
                    .assessment(assessment)
                    .fileName(storedName)
                    .originalFileName(file.getOriginalFilename())
                    .fileType(resolveFileType(file.getContentType()))
                    .fileSize(file.getSize())
                    .filePath(dest.toString())
                    .status(MedicalReport.ReportStatus.UPLOADED)
                    .build();

            // Perform OCR Extraction via Python ML microservice
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.pdf";
                    }
                });

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                // BUG FIX 3: Use the injected, configurable mlServiceUrl
                ResponseEntity<String> mlResponse = restTemplate.postForEntity(
                        mlServiceUrl + "/extract", requestEntity, String.class);

                if (mlResponse.getStatusCode() == HttpStatus.OK) {
                    // The ML service returns a JSON string like:
                    // {"glucose": 120.0, "bmi": 24.5, "cholesterol": 195.0}
                    // We store the raw JSON so the frontend can parse individual
                    // fields and pre-fill the assessment form.
                    report.setExtractedText(mlResponse.getBody());
                    report.setStatus(MedicalReport.ReportStatus.PROCESSED);
                    report.setProcessedAt(LocalDateTime.now());
                } else {
                    log.warn("ML service returned non-OK status {} for report {}", mlResponse.getStatusCode(), storedName);
                    report.setStatus(MedicalReport.ReportStatus.FAILED);
                }
            } catch (Exception e) {
                log.error("Failed to run ML OCR extraction on report {}: {}", storedName, e.getMessage());
                report.setStatus(MedicalReport.ReportStatus.FAILED);
            }

            report = reportRepository.save(report);
            log.info("Report uploaded: {} by {}", storedName, email);
            return toResponse(report);

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    // ── List ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ReportDto.Response> list(String email, Pageable pageable) {
        User user = findUser(email);
        return reportRepository.findByUserOrderByUploadedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    // ── Get By ID ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReportDto.Response getById(String email, Long id) {
        User user = findUser(email);
        MedicalReport report = reportRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        return toResponse(report);
    }

    // ── Download ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReportDto.DownloadResponse download(String email, Long id) {
        User user = findUser(email);
        MedicalReport report = reportRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        try {
            Path path = Paths.get(report.getFilePath());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("File not accessible: " + report.getFileName());
            }
            String contentType = resolveContentType(report.getFileType());
            return ReportDto.DownloadResponse.builder()
                    .resource(resource)
                    .fileName(report.getOriginalFileName())
                    .contentType(contentType)
                    .build();
        } catch (MalformedURLException e) {
            throw new RuntimeException("File path error", e);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────

    public void delete(String email, Long id) {
        User user = findUser(email);
        MedicalReport report = reportRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        try {
            Path path = Paths.get(report.getFilePath());
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Could not delete file from disk: {}", report.getFilePath());
        }

        reportRepository.delete(report);
        log.info("Report deleted: {} by {}", id, email);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File exceeds 10MB limit");
        }
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_TYPES.contains(ct)) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Allowed: PDF, PNG, JPEG");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return ".bin";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    private String resolveFileType(String contentType) {
        if (contentType == null)
            return "UNKNOWN";
        return switch (contentType) {
            case "application/pdf" -> "PDF";
            case "image/png" -> "PNG";
            case "image/jpeg", "image/jpg" -> "JPG";
            case "image/webp" -> "WEBP";
            default -> "UNKNOWN";
        };
    }

    private String resolveContentType(String fileType) {
        if (fileType == null)
            return "application/octet-stream";
        return switch (fileType) {
            case "PDF" -> "application/pdf";
            case "PNG" -> "image/png";
            case "JPG" -> "image/jpeg";
            case "WEBP" -> "image/webp";
            default -> "application/octet-stream";
        };
    }

    private ReportDto.Response toResponse(MedicalReport r) {
        return ReportDto.Response.builder()
                .id(r.getId())
                .fileName(r.getFileName())
                .originalFileName(r.getOriginalFileName())
                .fileType(r.getFileType())
                .fileSize(r.getFileSize())
                .extractedtext(r.getExtractedText())
                .status(r.getStatus())
                .assessmentId(r.getAssessment() != null ? r.getAssessment().getId() : null)
                .uploadedAt(r.getUploadedAt())
                .processedAt(r.getProcessedAt())
                .build();
    }
}