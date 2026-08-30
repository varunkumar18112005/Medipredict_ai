package com.example.Backend.config;

import com.example.Backend.Service.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Validation errors (field-level) ───────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = ((FieldError) err).getField();
            fieldErrors.put(field, err.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(
                ErrorResponse.of(HttpStatus.BAD_REQUEST, "Validation failed", fieldErrors));
    }

    // ── Business rule violations ──────────────────────────────────────
    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<ErrorResponse> handleEmailDelivery(EmailDeliveryException ex) {
        log.warn("Email delivery failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                ErrorResponse.of(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), null));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class, RuntimeException.class})
    public ResponseEntity<ErrorResponse> handleIllegalArg(Exception ex) {
        log.warn("Runtime business exception: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                ErrorResponse.of(HttpStatus.BAD_REQUEST, ex.getMessage() != null ? ex.getMessage() : "Request failed", null));
    }

    // ── Resource not found ────────────────────────────────────────────
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ErrorResponse.of(HttpStatus.NOT_FOUND, ex.getMessage(), null));
    }

    // ── Auth errors ───────────────────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCreds(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ErrorResponse.of(HttpStatus.UNAUTHORIZED, "Invalid email or password", null));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ErrorResponse.of(HttpStatus.FORBIDDEN, "Account is disabled", null));
    }

    // ── File too large ────────────────────────────────────────────────
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
                ErrorResponse.of(HttpStatus.PAYLOAD_TOO_LARGE, "File size exceeds 10MB limit", null));
    }

    // ── Media Type & Method not supported ─────────────────────────────────
    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(org.springframework.web.HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(
                ErrorResponse.of(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage(), null));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(
                ErrorResponse.of(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), null));
    }

    // ── Catch-all ─────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR,
                        "An unexpected error occurred: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()), null));
    }

    // ── Error response shape ──────────────────────────────────────────
    public record ErrorResponse(
            int status,
            String error,
            String message,
            Map<String, String> fieldErrors,
            LocalDateTime timestamp
    ) {
        static ErrorResponse of(HttpStatus status, String message, Map<String, String> fieldErrors) {
            return new ErrorResponse(
                    status.value(),
                    status.getReasonPhrase(),
                    message,
                    fieldErrors,
                    LocalDateTime.now()
            );
        }
    }
}
