package com.codementor.controller;

import com.codementor.dto.CodeRunRequest;
import com.codementor.dto.CodeRunResponse;
import com.codementor.model.*;
import com.codementor.repository.CodeSnippetRepository;
import com.codementor.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/code")
public class CodeController {

    @Autowired private CodeService codeService;
    @Autowired private CodeSnippetRepository snippetRepo;
    @Autowired private AuthService authService;

    @PostMapping("/run")
    public ResponseEntity<CodeRunResponse> runCode(@RequestBody CodeRunRequest req) {
        return ResponseEntity.ok(codeService.runCode(req));
    }

    @GetMapping("/snippets")
    public ResponseEntity<List<CodeSnippet>> getSnippets(Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        return ResponseEntity.ok(snippetRepo.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping("/snippets")
    public ResponseEntity<CodeSnippet> saveSnippet(
            @RequestBody Map<String, String> body, Authentication auth) {
        User user = authService.getByUsername(auth.getName());
        CodeSnippet snippet = CodeSnippet.builder()
                .userId(user.getId())
                .title(body.get("title"))
                .language(body.getOrDefault("language", "JAVA"))
                .code(body.get("code"))
                .build();
        return ResponseEntity.ok(snippetRepo.save(snippet));
    }

    @DeleteMapping("/snippets/{id}")
    public ResponseEntity<Void> deleteSnippet(@PathVariable Long id) {
        snippetRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
