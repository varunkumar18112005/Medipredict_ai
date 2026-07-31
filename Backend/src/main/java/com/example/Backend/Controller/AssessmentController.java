package com.example.Backend.Controller;

import com.example.Backend.Dto.AssessmentDto;
import com.example.Backend.model.Assessment;
import com.example.Backend.Service.AssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/assessments")
@RequiredArgsConstructor
@Tag(name = "Assessments", description = "Disease risk prediction and history")
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping
    @Operation(summary = "Submit health data and get disease risk prediction")
    public ResponseEntity<AssessmentDto.Response> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AssessmentDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.createAssessment(userDetails.getUsername(), request));
    }

    @GetMapping
    @Operation(summary = "Get paginated assessment history for logged-in user")
    public ResponseEntity<Page<AssessmentDto.HistoryResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                assessmentService.getHistory(userDetails.getUsername(), pageable));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get summary stats — total assessments, avg risk, trend")
    public ResponseEntity<AssessmentDto.SummaryStats> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                assessmentService.getSummaryStats(userDetails.getUsername()));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get historical risk score trends grouped by disease type")
    public ResponseEntity<Map<String, java.util.List<AssessmentDto.TrendPoint>>> getTrends(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                assessmentService.getTrends(userDetails.getUsername()));
    }

    @GetMapping("/{id:\\d+}")
    @Operation(summary = "Get a single assessment result by ID")
    public ResponseEntity<AssessmentDto.Response> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(
                assessmentService.getById(userDetails.getUsername(), id));
    }

    @GetMapping("/by-disease/{diseaseType}")
    @Operation(summary = "Get assessments filtered by disease type")
    public ResponseEntity<?> getByDisease(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Assessment.DiseaseType diseaseType) {
        return ResponseEntity.ok(
                assessmentService.getByDiseaseType(userDetails.getUsername(), diseaseType));
    }

    @DeleteMapping("/{id:\\d+}")
    @Operation(summary = "Delete an assessment record")
    public ResponseEntity<Map<String, String>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        assessmentService.delete(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Assessment deleted successfully"));
    }

    @PostMapping("/chat")
    @Operation(summary = "Get conversational AI response for follow-up questions")
    public ResponseEntity<Map<String, Object>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        String message = (String) payload.get("message");
        Long assessmentId = payload.get("assessmentId") != null ? Long.valueOf(payload.get("assessmentId").toString()) : null;
        return ResponseEntity.ok(assessmentService.chatWithAdvisor(userDetails.getUsername(), message, assessmentId));
    }
}

