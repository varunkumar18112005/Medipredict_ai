package com.example.Backend.Repository;

import com.example.Backend.model.HealthProfile;
import com.example.Backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Long> {
    Optional<HealthProfile> findByUser(User user);
    boolean existsByUser(User user);
}
