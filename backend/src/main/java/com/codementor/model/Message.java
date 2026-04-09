package com.codementor.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long chatId;

    @Column(nullable = false)
    private String role; // USER or ASSISTANT

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column
    private String createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now().toString();
    }
}
