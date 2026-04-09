package com.codementor.repository;

import com.codementor.model.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    List<UserProgress> findByUserId(Long userId);
    Optional<UserProgress> findByUserIdAndTopicId(Long userId, Long topicId);
    long countByUserIdAndStatus(Long userId, String status);
}
