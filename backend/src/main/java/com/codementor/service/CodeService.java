package com.codementor.service;

import com.codementor.dto.CodeRunRequest;
import com.codementor.dto.CodeRunResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
public class CodeService {

    @Value("${piston.api.url}")
    private String pistonUrl;

    @Autowired
    private AIService aiService;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CodeRunResponse runCode(CodeRunRequest req) {
        long start = System.currentTimeMillis();
        String lang = req.getLanguage() != null ? req.getLanguage().toUpperCase() : "JAVA";

        try {
            Map<String, Object> pistonReq = new HashMap<>();
            pistonReq.put("language", mapLang(lang));
            pistonReq.put("version", getVersion(lang));
            pistonReq.put("files", List.of(Map.of(
                    "name", "Main" + getExt(lang),
                    "content", req.getCode()
            )));
            if (req.getStdin() != null && !req.getStdin().isBlank()) {
                pistonReq.put("stdin", req.getStdin());
            }

            String reqJson = objectMapper.writeValueAsString(pistonReq);
            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create(pistonUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(reqJson))
                    .build();

            HttpResponse<String> response = httpClient.send(httpReq, HttpResponse.BodyHandlers.ofString());

            // If the public runner is restricted, fall back to local execution (best-effort).
            if (response.statusCode() != 200 && looksLikePistonRestricted(response.body())) {
                return runLocally(req, lang, start, "Public Piston API is restricted (whitelist-only).");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);

            // Some restriction responses still come as JSON with a message.
            String message = Objects.toString(body.get("message"), "");
            if (looksLikePistonRestricted(message)) {
                return runLocally(req, lang, start, message);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> compile = (Map<String, Object>) body.get("compile");
            @SuppressWarnings("unchecked")
            Map<String, Object> run = (Map<String, Object>) body.get("run");

            String output = "";
            String error = "";
            String aiAnalysis = "";
            String timeComplexity = "";
            String spaceComplexity = "";
            boolean success = false;

            String compileErr = compile != null ? Objects.toString(compile.getOrDefault("stderr", ""), "") : "";
            String runOut = run != null ? Objects.toString(run.getOrDefault("stdout", ""), "") : "";
            String runErr = run != null ? Objects.toString(run.getOrDefault("stderr", ""), "") : "";
            output = runOut;

            int exitCode = -1;
            if (run != null && run.get("code") != null) {
                try { exitCode = Integer.parseInt(String.valueOf(run.get("code"))); } catch (Exception ignored) {}
            }
            success = (run != null && exitCode == 0 && compileErr.isBlank() && runErr.isBlank());

            if (!compileErr.isBlank() || !runErr.isBlank()) {
                error = (compileErr + (compileErr.isBlank() || runErr.isBlank() ? "" : "\n") + runErr).trim();
                aiAnalysis = aiService.getSimpleResponse(
                        "You are a programming tutor. Explain this error and how to fix it.\n\n" +
                        "Language: " + lang + "\n" +
                        "Code:\n```" + lang.toLowerCase() + "\n" + req.getCode() + "\n```\n\n" +
                        "Error:\n" + error + "\n\n" +
                        "Return:\n" +
                        "1) The root cause in 1-2 lines\n" +
                        "2) Exact fix steps\n" +
                        "3) Corrected code snippet (only the changed part)\n"
                , 700);
            } else if (run == null) {
                String details = Objects.toString(body.get("message"), response.body());
                if (looksLikePistonRestricted(details)) {
                    return runLocally(req, lang, start, details);
                }
                error = "Execution service unavailable: " + details;
                aiAnalysis = aiService.getSimpleResponse(
                        "Explain to the user why code execution failed and give 3 alternatives:\n" +
                        "1) how to run locally\n" +
                        "2) how to self-host a runner\n" +
                        "3) how to still debug using reasoning\n\n" +
                        "Keep it short and actionable.\n\n" +
                        "Details:\n" + details
                , 350);
            } else {
                aiAnalysis = aiService.getSimpleResponse(
                        "Analyze this " + lang + " code. Code:\n```" + lang.toLowerCase() + "\n" + req.getCode() + "\n```\n" +
                        "Output:\n" + output + "\n\n" +
                        "Provide exactly in this structure:\n" +
                        "Time: O(...)\n" +
                        "Space: O(...)\n" +
                        "Tip: <one improvement tip>\n"
                , 450);
            }
            String[] extracted = extractComplexities(aiAnalysis);
            timeComplexity = extracted[0];
            spaceComplexity = extracted[1];
            long execTime = System.currentTimeMillis() - start;

            return CodeRunResponse.builder()
                    .output(output).error(error)
                    .success(success)
                    .executionTime(execTime).language(lang)
                    .timeComplexity(timeComplexity)
                    .spaceComplexity(spaceComplexity)
                    .aiAnalysis(aiAnalysis)
                    .build();

        } catch (Exception e) {
            // Last resort: try local for Java if remote fails.
            try {
                return runLocally(req, lang, start, "Remote execution failed: " + e.getMessage());
            } catch (Exception ignored) {}
            return CodeRunResponse.builder()
                    .error("Execution failed: " + e.getMessage())
                    .success(false).language(lang)
                    .build();
        }
    }

    private static boolean looksLikePistonRestricted(String body) {
        if (body == null) return false;
        String b = body.toLowerCase();
        return b.contains("whitelist") || b.contains("restricted") || b.contains("contact") && b.contains("discord");
    }

    private CodeRunResponse runLocally(CodeRunRequest req, String lang, long start, String reason) throws Exception {
        // Best-effort local runner to keep the app usable when remote execution is blocked.
        // Supports: JAVA always (JDK is already required for backend), PYTHON if `python` exists on PATH.
        String normalizedLang = lang != null ? lang.toUpperCase() : "JAVA";
        if (!Set.of("JAVA", "PYTHON").contains(normalizedLang)) {
            String msg = "[Runner unavailable] " + normalizedLang + " is not supported locally. " +
                    "Remote runner is unavailable. Reason: " + reason;
            return CodeRunResponse.builder()
                    .success(false)
                    .language(normalizedLang)
                    .error(msg)
                    .executionTime(System.currentTimeMillis() - start)
                    .aiAnalysis(aiService.getSimpleResponse(
                            "The online code runner is restricted and local runner doesn't support this language.\n" +
                                    "Explain the situation and give the user 3 options (local setup / switch language / self-host runner).\n" +
                                    "Language: " + normalizedLang + "\nReason: " + reason, 350))
                    .build();
        }

        Path dir = Files.createTempDirectory("codementor-run-");
        String stdout = "";
        String stderr = "";
        int exit = -1;

        try {
            if ("JAVA".equals(normalizedLang)) {
                Path file = dir.resolve("Main.java");
                Files.writeString(file, req.getCode() == null ? "" : req.getCode(), StandardCharsets.UTF_8);

                ExecResult comp = exec(new String[]{"javac", "Main.java"}, dir, "", 12);
                if (comp.exitCode != 0) {
                    stderr = comp.stderr.isBlank() ? comp.stdout : comp.stderr;
                    exit = comp.exitCode;
                } else {
                    ExecResult run = exec(new String[]{"java", "Main"}, dir, req.getStdin(), 8);
                    stdout = run.stdout;
                    stderr = run.stderr;
                    exit = run.exitCode;
                }
            } else if ("PYTHON".equals(normalizedLang)) {
                Path file = dir.resolve("main.py");
                Files.writeString(file, req.getCode() == null ? "" : req.getCode(), StandardCharsets.UTF_8);
                ExecResult run = exec(new String[]{"python", "main.py"}, dir, req.getStdin(), 8);
                stdout = run.stdout;
                stderr = run.stderr;
                exit = run.exitCode;
            }
        } finally {
            // Best-effort cleanup
            try {
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(p -> { try { Files.deleteIfExists(p); } catch (Exception ignored) {} });
            } catch (Exception ignored) {}
        }

        boolean ok = exit == 0 && (stderr == null || stderr.isBlank());
        String errMsg = (stderr == null ? "" : stderr).trim();
        String outMsg = (stdout == null ? "" : stdout);

        String ai = "";
        if (!ok) {
            ai = aiService.getSimpleResponse(
                    "You are a programming tutor. Help fix this error.\n\n" +
                            "Language: " + normalizedLang + "\n" +
                            "Code:\n```" + normalizedLang.toLowerCase() + "\n" + (req.getCode() == null ? "" : req.getCode()) + "\n```\n\n" +
                            "Error:\n" + (errMsg.isBlank() ? "(no stderr)" : errMsg) + "\n\n" +
                            "Return:\n" +
                            "1) Root cause (1-2 lines)\n" +
                            "2) Fix steps\n" +
                            "3) Corrected code snippet (only changed part)\n"
                    , 700);
        } else {
            ai = aiService.getSimpleResponse(
                    "Analyze this " + normalizedLang + " code briefly.\n" +
                            "Return exactly:\n" +
                            "Time: O(...)\n" +
                            "Space: O(...)\n" +
                            "Tip: <one improvement tip>\n\n" +
                            "Code:\n```" + normalizedLang.toLowerCase() + "\n" + (req.getCode() == null ? "" : req.getCode()) + "\n```\n" +
                            "Output:\n" + outMsg
                    , 450);
        }
        String[] extracted = extractComplexities(ai);

        String prefix = "[Local Runner] Remote unavailable: " + reason;
        String finalError = errMsg.isBlank() ? (ok ? "" : prefix) : (prefix + "\n" + errMsg);

        return CodeRunResponse.builder()
                .output(outMsg)
                .error(finalError)
                .success(ok)
                .executionTime(System.currentTimeMillis() - start)
                .language(normalizedLang)
                .timeComplexity(extracted[0])
                .spaceComplexity(extracted[1])
                .aiAnalysis(ai)
                .build();
    }

    private static String[] extractComplexities(String text) {
        String time = "";
        String space = "";
        if (text == null) return new String[]{"", ""};
        for (String raw : text.split("\\r?\\n")) {
            String line = raw.trim();
            String lower = line.toLowerCase();
            if (time.isBlank() && lower.startsWith("time:")) {
                time = line.substring(line.indexOf(':') + 1).trim();
            } else if (space.isBlank() && lower.startsWith("space:")) {
                space = line.substring(line.indexOf(':') + 1).trim();
            }
        }
        return new String[]{time, space};
    }

    private static class ExecResult {
        final int exitCode;
        final String stdout;
        final String stderr;
        ExecResult(int exitCode, String stdout, String stderr) {
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
        }
    }

    private static ExecResult exec(String[] cmd, Path dir, String stdin, int timeoutSeconds) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(dir.toFile());
        Process p = pb.start();

        if (stdin != null && !stdin.isBlank()) {
            p.getOutputStream().write(stdin.getBytes(StandardCharsets.UTF_8));
        }
        p.getOutputStream().close();

        ByteArrayOutputStream outBuf = new ByteArrayOutputStream();
        ByteArrayOutputStream errBuf = new ByteArrayOutputStream();
        Thread t1 = new Thread(() -> copy(p.getInputStream(), outBuf));
        Thread t2 = new Thread(() -> copy(p.getErrorStream(), errBuf));
        t1.start(); t2.start();

        boolean finished = p.waitFor(timeoutSeconds, java.util.concurrent.TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            return new ExecResult(124, outBuf.toString(StandardCharsets.UTF_8), "Timed out after " + timeoutSeconds + "s");
        }

        t1.join(1000);
        t2.join(1000);
        int code = p.exitValue();
        return new ExecResult(code, outBuf.toString(StandardCharsets.UTF_8), errBuf.toString(StandardCharsets.UTF_8));
    }

    private static void copy(InputStream in, ByteArrayOutputStream out) {
        try (in) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
        } catch (Exception ignored) {}
    }

    private String mapLang(String lang) {
        return switch (lang) {
            case "JAVA" -> "java";
            case "PYTHON" -> "python";
            case "CPP" -> "c++";
            case "JAVASCRIPT" -> "javascript";
            default -> "java";
        };
    }

    private String getVersion(String lang) {
        return switch (lang) {
            case "JAVA" -> "15.0.2";
            case "PYTHON" -> "3.10.0";
            case "CPP" -> "10.2.0";
            case "JAVASCRIPT" -> "18.15.0";
            default -> "*";
        };
    }

    private String getExt(String lang) {
        return switch (lang) {
            case "JAVA" -> ".java";
            case "PYTHON" -> ".py";
            case "CPP" -> ".cpp";
            case "JAVASCRIPT" -> ".js";
            default -> ".java";
        };
    }
}
