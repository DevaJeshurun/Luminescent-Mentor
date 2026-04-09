package com.codementor.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column
    @Builder.Default
    private String skillLevel = "BEGINNER";

    @Column
    @Builder.Default
    private String preferredLanguage = "JAVA";

    @Column
    @Builder.Default
    private Integer xpPoints = 0;

    @Column
    @Builder.Default
    private Integer streakDays = 0;

    @Column
    private String lastActiveDate;

    @Column
    @Builder.Default
    private String role = "USER";

    @Column
    @Builder.Default
    private String avatarUrl = "";

    @Column
    private String createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now().toString();
        lastActiveDate = LocalDate.now().toString();
    }
}
