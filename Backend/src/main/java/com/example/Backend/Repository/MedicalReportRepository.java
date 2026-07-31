package com.example.Backend.Repository;

import com.example.Backend.model.MedicalReport;
import com.example.Backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    Page<MedicalReport> findByUserOrderByUploadedAtDesc(User user, Pageable pageable);
    Optional<MedicalReport> findByIdAndUser(Long id, User user);
    List<MedicalReport> findByStatus(MedicalReport.ReportStatus status);
}
