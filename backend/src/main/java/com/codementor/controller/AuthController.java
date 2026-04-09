package com.codementor.controller;

import com.codementor.dto.AuthRequest;
import com.codementor.dto.AuthResponse;
import com.codementor.model.User;
import com.codementor.security.JwtTokenProvider;
import com.codementor.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthService authService;
    @Autowired private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /**
     * POST /api/auth/refresh
     * Called with the existing (still-valid) Bearer token.
     * Issues a brand-new token so the session never expires silently.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(Authentication auth) {
        String newToken = jwtTokenProvider.generateToken(auth.getName());
        return ResponseEntity.ok(Map.of("token", newToken));
    }

    @GetMapping("/me")
    public ResponseEntity<User> me(Authentication auth) {
        return ResponseEntity.ok(authService.getByUsername(auth.getName()));
    }
}
