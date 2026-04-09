package com.codementor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.function.Consumer;

@Service
public class AIService {

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Value("${openrouter.api.url}")
    private String apiUrl;

    @Value("${openrouter.model}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String FORMAT_RULES = """

            === FORMATTING RULES ===
            - Write in clean Markdown.
            - Use ## headings to separate sections.
            - Use bullet points for lists, numbered steps for sequences.
            - Always wrap code in fenced blocks with language tag, e.g. ```java or ```python
            - Keep paragraphs short (2-3 sentences max).
            - Use **bold** for key terms.
            - Be beginner-friendly but technically accurate.
            - Show complexity as: Time: O(...) | Space: O(...)
            - Start with a direct short answer in 1-2 lines before detailed explanation.
            - If the user asks a simple question, answer directly first (do not delay with long preface).
            """;

    private static final Map<String, String> SYSTEM_PROMPTS = new LinkedHashMap<>();

    static {
        SYSTEM_PROMPTS.put("EXPLAIN_SIMPLY",
            "You are CodeMentor AI, an expert tutor who explains code in the SIMPLEST way possible for students.\n" +
            "When you receive code:\n" +
            "1. Detect the programming language and state it.\n" +
            "2. Give a one-line summary of what the code does.\n" +
            "3. Explain using a real-world analogy a beginner would understand.\n" +
            "4. Break down each key part in plain English — no jargon.\n" +
            "5. End with an encouraging note for the student.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("LINE_BY_LINE",
            "You are CodeMentor AI, a precise line-by-line code explanation expert.\n" +
            "When you receive code:\n" +
            "1. Detect the language and state it.\n" +
            "2. Explain every meaningful line or block individually in order.\n" +
            "3. For each line write: `Line X:` followed by what it does in plain English.\n" +
            "4. Group related lines (e.g., a loop body) and explain the group collectively too.\n" +
            "5. Mark tricky or important lines with ⚠️.\n" +
            "6. End with a one-paragraph overall summary.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("DRY_RUN",
            "You are CodeMentor AI, a dry run simulation expert.\n" +
            "When you receive code:\n" +
            "1. Detect the language.\n" +
            "2. Choose a clear, simple sample input.\n" +
            "3. Trace through the code step-by-step showing the VALUE of every variable at each step.\n" +
            "4. Format as a numbered trace: Step | Line | Variable Changes | Output.\n" +
            "5. Show the final output clearly.\n" +
            "6. Repeat with a second input (edge case) to show different behavior.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("COMPLEXITY",
            "You are CodeMentor AI, an algorithm complexity analysis expert.\n" +
            "When you receive code:\n" +
            "1. Detect the language.\n" +
            "2. Analyze TIME complexity: explain which loops/recursions drive it, give Big-O.\n" +
            "3. Analyze SPACE complexity: explain extra memory used, give Big-O.\n" +
            "4. Show best case, average case, and worst case if they differ.\n" +
            "5. Compare to a brute-force approach if applicable.\n" +
            "6. Suggest if a more optimal complexity is achievable and how.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("OPTIMIZE",
            "You are CodeMentor AI, a code optimization and refactoring expert.\n" +
            "When you receive code:\n" +
            "1. Detect the language.\n" +
            "2. Identify all inefficiencies, code smells, and anti-patterns.\n" +
            "3. Explain what the brute force approach is and why it is slow.\n" +
            "4. Provide a fully optimized, runnable, clean version of the code.\n" +
            "5. Explain each optimization made and WHY it is better.\n" +
            "6. Show complexity improvement: Before vs After.\n" +
            "7. List best practices applied.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("DEBUG",
            "You are CodeMentor AI, an expert debugger and error explainer.\n" +
            "When you receive code with an error or bug:\n" +
            "1. Detect the language.\n" +
            "2. Identify ALL bugs, errors, and logical mistakes.\n" +
            "3. Explain what each error means in simple English.\n" +
            "4. Explain WHY the error occurs (root cause analysis).\n" +
            "5. Show the corrected code with comments marking the fixes.\n" +
            "6. List common mistakes that cause this type of error.\n" +
            "7. Explain how to prevent this in the future.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("CONVERT",
            "You are CodeMentor AI, a multi-language code conversion expert.\n" +
            "When you receive code to convert:\n" +
            "1. Detect the source language.\n" +
            "2. Identify the target language from the request.\n" +
            "3. Convert the complete code to the target language, ensuring 100% logical equivalence.\n" +
            "4. Explain key differences between the two languages for this code.\n" +
            "5. Point out language-specific idioms used in the converted version.\n" +
            "Supported: Java, Python, C, C++, JavaScript, TypeScript, Go, SQL, Rust.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("INTERVIEW",
            "You are CodeMentor AI, a top FAANG-level technical interview coach.\n" +
            "When you receive code or a problem:\n" +
            "1. Explain how to APPROACH this problem in an interview: Clarify → Brute Force → Optimize → Code.\n" +
            "2. Show the optimal solution with clean, commented code.\n" +
            "3. Explain time and space complexity as you would to an interviewer.\n" +
            "4. List 3-5 follow-up questions an interviewer might ask.\n" +
            "5. List common mistakes candidates make on this problem type.\n" +
            "6. Give tips for communicating clearly during the interview.\n" +
            FORMAT_RULES
        );

        SYSTEM_PROMPTS.put("VIVA",
            "You are CodeMentor AI, a university viva/oral exam preparation expert.\n" +
            "When you receive code or a topic:\n" +
            "1. Generate 8-10 viva questions a professor would ask.\n" +
            "2. Provide clear, concise model answers for each question.\n" +
            "3. Rate each question difficulty (Easy / Medium / Hard).\n" +
            "4. Add 3 trick questions professors commonly ask.\n" +
            "5. List key concepts the student MUST know.\n" +
            "6. Give a quick revision summary at the end.\n" +
            FORMAT_RULES
        );
    }

    // ── Streaming ──────────────────────────────────────────────────────────

    public void streamChat(String mode, List<Map<String, String>> messages, SseEmitter emitter) {
        streamChat(mode, messages, emitter, null);
    }

    public void streamChat(String mode, List<Map<String, String>> messages,
                           SseEmitter emitter, Consumer<String> onToken) {

        String systemPrompt = SYSTEM_PROMPTS.getOrDefault(mode,
            "You are CodeMentor AI, an expert programming tutor. Explain clearly, step by step.\n" + FORMAT_RULES);

        new Thread(() -> {
            try {
                List<Map<String, String>> allMessages = new ArrayList<>();
                allMessages.add(Map.of("role", "system", "content", systemPrompt));
                allMessages.addAll(messages);

                Map<String, Object> body = new HashMap<>();
                body.put("model", model);
                body.put("stream", true);
                body.put("messages", allMessages);
                body.put("max_tokens", 1200);
                body.put("temperature", 0.3);

                String reqJson = objectMapper.writeValueAsString(body);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl + "/chat/completions"))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("Content-Type", "application/json")
                        .header("HTTP-Referer", "http://localhost:5173")
                        .header("X-Title", "CodeMentor AI")
                        .timeout(Duration.ofSeconds(90))
                        .POST(HttpRequest.BodyPublishers.ofString(reqJson))
                        .build();

                HttpResponse<java.io.InputStream> response =
                        httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

                int status = response.statusCode();
                if (status != 200) {
                    String errorBody = new String(response.body().readAllBytes());
                    String errMsg = buildErrorMessage(status, errorBody);
                    String fallback = "AI service is temporarily unavailable (" + errMsg + ").\n\n" +
                            "Quick fallback guidance:\n" +
                            "1. Rephrase your question in 1-2 lines.\n" +
                            "2. If code is involved, paste minimal runnable code.\n" +
                            "3. Ask one specific request (explain/debug/optimize).\n\n" +
                            "Try again in a minute and I will continue from there.";
                    if (onToken != null) onToken.accept(fallback);
                    emitter.send(SseEmitter.event().data(fallback));
                    emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                    emitter.complete();
                    return;
                }

                // True line-by-line streaming via InputStream
                try (BufferedReader reader =
                             new BufferedReader(new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String trimmed = line.trim();
                        if (!trimmed.startsWith("data:")) continue;

                        String data = trimmed.substring(5).trim();
                        if (data.equals("[DONE]")) break;
                        if (data.isEmpty()) continue;

                        try {
                            JsonNode node = objectMapper.readTree(data);
                            JsonNode choices = node.get("choices");
                            if (choices == null || !choices.isArray() || choices.isEmpty()) continue;

                            JsonNode delta = choices.get(0).get("delta");
                            if (delta == null || !delta.has("content")) continue;

                            String content = delta.get("content").asText("");
                            if (content.isEmpty()) continue;

                            if (onToken != null) onToken.accept(content);
                            emitter.send(SseEmitter.event().data(content));
                        } catch (Exception ignored) {}
                    }
                }

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();

            } catch (Exception e) {
                try {
                    String fallback = "AI request failed due to a temporary connection issue.\n\n" +
                            "Please retry. If it keeps failing:\n" +
                            "- Check internet connection\n" +
                            "- Verify OpenRouter API key and credits\n" +
                            "- Retry with a shorter prompt";
                    if (onToken != null) onToken.accept(fallback);
                    emitter.send(SseEmitter.event().data(fallback));
                    emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        }).start();
    }

    // ── Non-streaming helper ───────────────────────────────────────────────

    public String getSimpleResponse(String prompt) {
        return getSimpleResponse(prompt, 512);
    }

    public String getSimpleResponse(String prompt, int maxTokens) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("stream", false);
            body.put("messages", List.of(
                    Map.of("role", "system", "content",
                            "You are a concise programming code analyzer. Be brief and precise. Use Markdown."),
                    Map.of("role", "user", "content", prompt)
            ));
            body.put("max_tokens", maxTokens);
            body.put("temperature", 0.2);

            String reqJson = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "http://localhost:5173")
                    .header("X-Title", "CodeMentor AI")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(reqJson))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200)
                return "Analysis unavailable (HTTP " + response.statusCode() + ")";

            JsonNode node = objectMapper.readTree(response.body());
            return node.at("/choices/0/message/content").asText("Analysis unavailable.");
        } catch (Exception e) {
            return "AI analysis unavailable: " + e.getMessage();
        }
    }

    // ── Utility ────────────────────────────────────────────────────────────

    private String buildErrorMessage(int status, String body) {
        if (status == 401) return "Invalid API Key. Please check your OpenRouter API key.";
        if (status == 402) return "Insufficient OpenRouter credits. Please top up your account.";
        if (status == 404) return "AI model not found. Check the model name in configuration.";
        if (status == 429) return "Rate limit reached. Please wait 1-2 minutes and try again.";
        if (status == 503) return "AI service temporarily unavailable. Please try again shortly.";
        try {
            JsonNode err = objectMapper.readTree(body);
            String msg = err.at("/error/message").asText("");
            if (!msg.isEmpty()) return msg;
        } catch (Exception ignored) {}
        return "AI service error (HTTP " + status + "). Please try again.";
    }

    public List<String> getSupportedModes() {
        return new ArrayList<>(SYSTEM_PROMPTS.keySet());
    }
}
