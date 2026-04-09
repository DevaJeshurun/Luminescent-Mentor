package com.codementor.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRunResponse {
    private String output;
    private String error;
    private boolean success;
    private Long executionTime;
    private String language;
    private String timeComplexity;
    private String spaceComplexity;
    private String aiAnalysis;
}
