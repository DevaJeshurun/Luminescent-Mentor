package com.codementor.controller;

import com.codementor.dto.ChatRequest;
import com.codementor.model.*;
import com.codementor.repository.*;
import com.codementor.service.AIService;
import com.codementor.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired private AIService aiService;
    @Autowired private ChatRepository chatRepo;
    @Autowired private MessageRepository messageRepo;
    @Autowired private AuthService authService;

    @GetMapping("/sessions")
    public ResponseEntity<List<Chat>> getSessions(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(chatRepo.findByUserIdOrderByUpdatedAtDesc(user.getId()));
    }

    @PostMapping("/session")
    public ResponseEntity<Chat> createSession(@RequestBody Map<String, String> body, Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        Map<String, String> payload = body != null ? body : Collections.emptyMap();
        Chat chat = Chat.builder()
                .userId(user.getId())
                .title(payload.getOrDefault("title", "New Chat"))
                .mode(payload.getOrDefault("mode", "JAVA_TUTOR"))
                .build();
        return ResponseEntity.ok(chatRepo.save(chat));
    }

    @GetMapping("/session/{chatId}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long chatId) {
        return ResponseEntity.ok(messageRepo.findByChatIdOrderByCreatedAtAsc(chatId));
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(@RequestBody ChatRequest req, Authentication auth) {
        SseEmitter emitter = new SseEmitter(120_000L);

        User user = authService.getByUsername(auth.getName());
        Long effectiveChatId = req.getChatId();
        if (effectiveChatId == null) {
            Chat chat = Chat.builder()
                    .userId(user.getId())
                    .title(buildTitle(req.getMessage()))
                    .mode(req.getMode() != null ? req.getMode() : "JAVA_TUTOR")
                    .build();
            effectiveChatId = chatRepo.save(chat).getId();
        }

        // Save user message
        if (effectiveChatId != null) {
            messageRepo.save(Message.builder()
                    .chatId(effectiveChatId)
                    .role("USER")
                    .content(req.getMessage())
                    .build());
        }

        // Build conversation history
        List<Map<String, String>> history = new ArrayList<>();
        if (effectiveChatId != null) {
            List<Message> msgs = messageRepo.findByChatIdOrderByCreatedAtAsc(effectiveChatId);
            history = msgs.stream()
                    .map(m -> Map.of("role", m.getRole().toLowerCase(), "content", m.getContent()))
                    .collect(Collectors.toList());
        } else if (req.getHistory() != null) {
            history = req.getHistory();
        } else {
            history = List.of(Map.of("role", "user", "content", req.getMessage()));
        }

        final List<Map<String, String>> finalHistory = history;
        final String mode = req.getMode() != null ? req.getMode() : "JAVA_TUTOR";
        final Long chatId = effectiveChatId;

        // Collect full response to save
        StringBuilder fullResponse = new StringBuilder();

        emitter.onCompletion(() -> {
            if (chatId != null && fullResponse.length() > 0) {
                messageRepo.save(Message.builder()
                        .chatId(chatId)
                        .role("ASSISTANT")
                        .content(fullResponse.toString())
                        .build());
                chatRepo.findById(chatId).ifPresent(c -> {
                    c.setUpdatedAt(LocalDateTime.now().toString());
                    chatRepo.save(c);
                });
            }
        });

        new Thread(() -> aiService.streamChat(mode, finalHistory, emitter, fullResponse::append)).start();

        return emitter;
    }

    private static String buildTitle(String message) {
        if (message == null || message.isBlank()) return "New Chat";
        String cleaned = message.replaceAll("\\s+", " ").trim();
        return cleaned.length() > 42 ? cleaned.substring(0, 42) + "..." : cleaned;
    }

    @DeleteMapping("/session/{chatId}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long chatId) {
        chatRepo.deleteById(chatId);
        return ResponseEntity.ok().build();
    }
}
