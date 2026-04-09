package com.codementor.controller;

import com.codementor.model.*;
import com.codementor.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/roadmap")
public class RoadmapController {

    @Autowired private RoadmapService roadmapService;
    @Autowired private AuthService authService;

    @GetMapping("/topics")
    public ResponseEntity<List<RoadmapTopic>> getTopics() {
        return ResponseEntity.ok(roadmapService.getAllTopics());
    }

    @GetMapping("/progress")
    public ResponseEntity<List<UserProgress>> getProgress(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(roadmapService.getUserProgress(user.getId()));
    }

    @PutMapping("/progress/{topicId}")
    public ResponseEntity<UserProgress> updateProgress(
            @PathVariable Long topicId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(roadmapService.updateProgress(user.getId(), topicId, body.get("status")));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(roadmapService.getProgressStats(user.getId()));
    }
}
