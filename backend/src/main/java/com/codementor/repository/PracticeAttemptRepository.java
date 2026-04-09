package com.codementor.repository;

import com.codementor.model.PracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {
    List<PracticeAttempt> findByUserId(Long userId);
    List<PracticeAttempt> findByUserIdAndStatus(Long userId, String status);
    long countByUserIdAndStatus(Long userId, String status);
}
