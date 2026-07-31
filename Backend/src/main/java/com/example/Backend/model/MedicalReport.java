package com.example.Backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_reports")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    private String fileName;
    private String originalFileName;
    private String fileType;        // PDF, PNG, JPG
    private Long fileSize;          // bytes
    private String filePath;
    private String extractedText;   // OCR extracted text

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus status = ReportStatus.UPLOADED;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    private LocalDateTime processedAt;

    public enum ReportStatus {
        UPLOADED, PROCESSING, PROCESSED, FAILED
    }
}
