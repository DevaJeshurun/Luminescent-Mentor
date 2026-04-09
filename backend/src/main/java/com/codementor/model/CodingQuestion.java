package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "coding_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String problemCode;

    @Column(nullable = false)
    private String title;

    @Column
    private String topic;

    @Column
    private String difficulty; // EASY, MEDIUM, HARD

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column
    private String sourceUrl;

    @Column
    @Builder.Default
    private String platform = "Codeforces";

    @Column
    private String successRate;

    @Column
    @Builder.Default
    private Integer solvedCount = 0;

    @Column(columnDefinition = "TEXT")
    private String statementPreview;

    @Column
    private Integer rating;

    @Column
    private Integer contestId;

    @Column
    private LocalDateTime createdAt;
}
