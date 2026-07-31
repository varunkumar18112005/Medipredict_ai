package com.example.Backend.Controller;

import com.example.Backend.Dto.ReportDto;
import com.example.Backend.Service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Medical Reports", description = "Upload and manage medical documents")
public class ReportController {

    private final ReportService reportService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a medical report (PDF or image, max 10MB)")
    public ResponseEntity<?> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long assessmentId) {

        // BUG FIX: IllegalArgumentException from validate() was previously
        // propagating as a 500 Internal Server Error. Catch it here and
        // return a proper 400 Bad Request so the mobile app can show
        // a meaningful message to the user (wrong file type, too large, etc.)
        try {
            return ResponseEntity.ok(
                    reportService.upload(userDetails.getUsername(), file, assessmentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "List all uploaded medical reports for the user")
    public ResponseEntity<Page<ReportDto.Response>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(reportService.list(userDetails.getUsername(), pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get details of a single report")
    public ResponseEntity<ReportDto.Response> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(reportService.getById(userDetails.getUsername(), id));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download the original report file")
    public ResponseEntity<Resource> download(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        ReportDto.DownloadResponse dl = reportService.download(userDetails.getUsername(), id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + dl.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(dl.getContentType()))
                .body(dl.getResource());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a medical report")
    public ResponseEntity<Map<String, String>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        reportService.delete(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Report deleted successfully"));
    }
}