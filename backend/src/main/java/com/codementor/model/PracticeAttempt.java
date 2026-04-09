package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "practice_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long problemId;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column
    @Builder.Default
    private String language = "JAVA";

    @Column
    @Builder.Default
    private String status = "ATTEMPTED"; // ATTEMPTED, SOLVED, FAILED

    @Column
    @Builder.Default
    private Integer timeTaken = 0;

    @Column
    private String createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now().toString();
    }
}
