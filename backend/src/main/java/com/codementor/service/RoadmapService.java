package com.codementor.service;

import com.codementor.model.*;
import com.codementor.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RoadmapService {

    @Autowired private RoadmapTopicRepository topicRepo;
    @Autowired private UserProgressRepository progressRepo;

    public List<RoadmapTopic> getAllTopics() {
        return topicRepo.findAllByOrderByTopicOrderAsc();
    }

    public List<UserProgress> getUserProgress(Long userId) {
        return progressRepo.findByUserId(userId);
    }

    public UserProgress updateProgress(Long userId, Long topicId, String status) {
        UserProgress progress = progressRepo.findByUserIdAndTopicId(userId, topicId)
                .orElse(UserProgress.builder().userId(userId).topicId(topicId).build());
        progress.setStatus(status);
        if ("COMPLETED".equals(status)) {
            progress.setCompletedAt(java.time.LocalDateTime.now().toString());
        }
        return progressRepo.save(progress);
    }

    public Map<String, Object> getProgressStats(Long userId) {
        long total = topicRepo.count();
        long completed = progressRepo.countByUserIdAndStatus(userId, "COMPLETED");
        long inProgress = progressRepo.countByUserIdAndStatus(userId, "IN_PROGRESS");
        double pct = total > 0 ? (completed * 100.0 / total) : 0;
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("completed", completed);
        stats.put("inProgress", inProgress);
        stats.put("percentage", Math.round(pct));
        return stats;
    }
}
