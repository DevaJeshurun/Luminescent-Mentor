package com.codementor.controller;

import com.codementor.model.User;
import com.codementor.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired private AnalyticsService analyticsService;
    @Autowired private AuthService authService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(analyticsService.getDashboard(user.getId()));
    }
}
