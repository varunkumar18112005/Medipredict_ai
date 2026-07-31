package com.example.Backend.Repository;

import com.example.Backend.model.Assessment;
import com.example.Backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    Page<Assessment> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<Assessment> findByUserAndDiseaseTypeOrderByCreatedAtDesc(
            User user, Assessment.DiseaseType diseaseType);

    Optional<Assessment> findByIdAndUser(Long id, User user);

    Optional<Assessment> findFirstByUserAndStatusOrderByCreatedAtDesc(User user, Assessment.AssessmentStatus status);

    @Query("SELECT a FROM Assessment a WHERE a.user = :user AND a.createdAt >= :from ORDER BY a.createdAt DESC")
    List<Assessment> findRecentByUser(@Param("user") User user, @Param("from") LocalDateTime from);

    @Query("SELECT AVG(a.riskScore) FROM Assessment a WHERE a.user = :user AND (a.status = 'COMPLETED' OR a.riskScore IS NOT NULL)")
    Double findAvgRiskScoreByUser(@Param("user") User user);

    @Query("SELECT COUNT(a) FROM Assessment a WHERE a.user = :user AND (a.status = 'COMPLETED' OR a.riskScore IS NOT NULL)")
    long countCompletedByUser(@Param("user") User user);

    @Query("SELECT a.diseaseType, COUNT(a) FROM Assessment a WHERE a.user = :user GROUP BY a.diseaseType")
    List<Object[]> countByDiseaseTypeForUser(@Param("user") User user);

    @Query("SELECT a FROM Assessment a WHERE a.user = :user AND a.status = :status ORDER BY a.createdAt ASC")
    List<Assessment> findByUserAndStatusOrderByCreatedAtAsc(@Param("user") User user, @Param("status") Assessment.AssessmentStatus status);

    @Query("SELECT a FROM Assessment a WHERE a.user = :user AND (a.status = 'COMPLETED' OR a.riskScore IS NOT NULL) ORDER BY a.createdAt ASC")
    List<Assessment> findCompletedOrScoredByUserOrderByCreatedAtAsc(@Param("user") User user);

    List<Assessment> findByStatus(Assessment.AssessmentStatus status);
}
