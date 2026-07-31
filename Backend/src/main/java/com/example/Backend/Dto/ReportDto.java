package com.example.Backend.Dto;

import com.example.Backend.model.MedicalReport;
import lombok.*;
import org.springframework.core.io.Resource;

import java.time.LocalDateTime;

public class ReportDto {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id;
        private String fileName;
        private String originalFileName;
        private String fileType;
        private Long fileSize;
        private String extractedtext;
        private MedicalReport.ReportStatus status;
        private Long assessmentId;
        private LocalDateTime uploadedAt;
        private LocalDateTime processedAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DownloadResponse {
        private Resource resource;
        private String fileName;
        private String contentType;
    }
}
