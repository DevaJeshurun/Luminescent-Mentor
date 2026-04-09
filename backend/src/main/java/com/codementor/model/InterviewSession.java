package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column
    private String type; // DSA, JAVA_VIVA, HR, CODING

    @Column(columnDefinition = "TEXT")
    private String questions;

    @Column(columnDefinition = "TEXT")
    private String answers;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column
    @Builder.Default
    private Integer score = 0;

    @Column
    @Builder.Default
    private Integer confidenceScore = 0;

    @Column
    private String completedAt;

    @PrePersist
    protected void onCreate() {
        completedAt = LocalDateTime.now().toString();
    }
}
