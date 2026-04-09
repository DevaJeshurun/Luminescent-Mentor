package com.codementor.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String email;
    private String skillLevel;
    private Integer xpPoints;
    private Integer streakDays;
    private String role;
}
