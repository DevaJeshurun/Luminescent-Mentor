package com.codementor.dto;

import lombok.Data;

@Data
public class CodeRunRequest {
    private String code;
    private String language;
    private String stdin;
}
