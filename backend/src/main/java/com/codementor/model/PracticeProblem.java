package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "practice_problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeProblem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String difficulty; // EASY, MEDIUM, HARD

    @Column
    private String category; // Arrays, Strings, Trees, etc.

    @Column
    private String companyTags; // Google,Amazon,Meta

    @Column(columnDefinition = "TEXT")
    private String javaTemplate;

    @Column(columnDefinition = "TEXT")
    private String javaSolution;

    @Column(columnDefinition = "TEXT")
    private String bruteForceSolution;

    @Column
    private String timeComplexity;

    @Column
    private String spaceComplexity;

    @Column(columnDefinition = "TEXT")
    private String hints;

    @Column
    @Builder.Default
    private Integer solveCount = 0;
}
