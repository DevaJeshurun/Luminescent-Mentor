package com.codementor.controller;

import com.codementor.model.*;
import com.codementor.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    @Autowired private InterviewService interviewService;
    @Autowired private AuthService authService;

    @GetMapping("/history")
    public ResponseEntity<List<InterviewSession>> getHistory(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(interviewService.getHistory(user.getId()));
    }

    @PostMapping("/submit")
    public ResponseEntity<InterviewSession> submit(
            @RequestBody Map<String, Object> body, Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        String type = (String) body.getOrDefault("type", "DSA");
        String questions = (String) body.getOrDefault("questions", "");
        String answers = (String) body.getOrDefault("answers", "");
        int score = (int) body.getOrDefault("score", 0);
        return ResponseEntity.ok(interviewService.saveSession(user.getId(), type, questions, answers, score));
    }
}
