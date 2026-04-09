package com.codementor.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {
    private Long chatId;
    private String message;
    private String mode;
    private List<Map<String, String>> history;
}
