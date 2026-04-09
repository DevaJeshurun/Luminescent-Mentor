package com.codementor.service;

import com.codementor.dto.AuthRequest;
import com.codementor.dto.AuthResponse;
import com.codementor.model.User;
import com.codementor.repository.UserRepository;
import com.codementor.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private StreakService streakService;

    public AuthResponse register(AuthRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new RuntimeException("Username already taken");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered");

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .skillLevel(req.getSkillLevel() != null ? req.getSkillLevel() : "BEGINNER")
                .build();
        userRepository.save(user);
        streakService.recordDailyActivity(user);
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getUsername());
        return AuthResponse.builder()
                .token(token).userId(user.getId())
                .username(user.getUsername()).email(user.getEmail())
                .skillLevel(user.getSkillLevel()).xpPoints(user.getXpPoints())
                .streakDays(user.getStreakDays()).role(user.getRole())
                .build();
    }

    public AuthResponse login(AuthRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        streakService.recordDailyActivity(user);
        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getUsername());
        return AuthResponse.builder()
                .token(token).userId(user.getId())
                .username(user.getUsername()).email(user.getEmail())
                .skillLevel(user.getSkillLevel()).xpPoints(user.getXpPoints())
                .streakDays(user.getStreakDays()).role(user.getRole())
                .build();
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
