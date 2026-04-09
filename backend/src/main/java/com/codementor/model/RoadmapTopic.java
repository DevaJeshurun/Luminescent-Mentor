package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmap_topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer topicOrder;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String level; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column
    private String category; // FUNDAMENTALS, OOP, DATA_STRUCTURES, ALGORITHMS, SYSTEM_DESIGN

    @Column
    private Integer estimatedHours;

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @Column(columnDefinition = "TEXT")
    private String whyItMatters;

    @Column(columnDefinition = "TEXT")
    private String commonMistakes;

    @Column(columnDefinition = "TEXT")
    private String javaImplementation;

    @Column
    private String timeComplexity;

    @Column
    private String spaceComplexity;

    @Column(columnDefinition = "TEXT")
    private String practiceProblems;

    @Column(columnDefinition = "TEXT")
    private String interviewQuestions;

    @Column
    @Builder.Default
    private String icon = "📚";

    @Column
    @Builder.Default
    private Boolean isLocked = false;
}
