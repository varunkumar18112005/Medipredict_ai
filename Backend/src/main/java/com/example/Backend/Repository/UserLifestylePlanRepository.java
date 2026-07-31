package com.example.Backend.Repository;

import com.example.Backend.model.User;
import com.example.Backend.model.UserLifestylePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserLifestylePlanRepository extends JpaRepository<UserLifestylePlan, Long> {
    Optional<UserLifestylePlan> findByUser(User user);
    Optional<UserLifestylePlan> findByUserId(Long userId);
}
