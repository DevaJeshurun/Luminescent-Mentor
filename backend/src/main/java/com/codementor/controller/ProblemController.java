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
@RequestMapping("/api/problems")
public class ProblemController {

    @Autowired private ProblemService problemService;
    @Autowired private AuthService authService;

    @GetMapping
    public ResponseEntity<List<PracticeProblem>> getAll(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category) {
        if (difficulty != null && category != null)
            return ResponseEntity.ok(problemService.getAll());
        if (difficulty != null)
            return ResponseEntity.ok(problemService.getByDifficulty(difficulty));
        if (category != null)
            return ResponseEntity.ok(problemService.getByCategory(category));
        return ResponseEntity.ok(problemService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PracticeProblem> getById(@PathVariable Long id) {
        return ResponseEntity.ok(problemService.getById(id));
    }

    @PostMapping("/{id}/attempt")
    public ResponseEntity<PracticeAttempt> submitAttempt(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        String code = (String) body.get("code");
        String lang = (String) body.getOrDefault("language", "JAVA");
        int timeTaken = (int) body.getOrDefault("timeTaken", 0);
        boolean solved = (boolean) body.getOrDefault("solved", false);
        return ResponseEntity.ok(problemService.submitAttempt(user.getId(), id, code, lang, timeTaken, solved));
    }

    @GetMapping("/attempts")
    public ResponseEntity<List<PracticeAttempt>> getAttempts(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(problemService.getUserAttempts(user.getId()));
    }
}
