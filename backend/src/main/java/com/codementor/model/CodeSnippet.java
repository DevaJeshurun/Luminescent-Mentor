package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "code_snippets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeSnippet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column
    @Builder.Default
    private String language = "JAVA";

    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    @Column
    private String createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now().toString();
    }
}
