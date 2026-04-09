package com.codementor.controller;

import com.codementor.model.CodingQuestion;
import com.codementor.repository.CodingQuestionRepository;
import com.codementor.service.CodeforcesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired private CodingQuestionRepository questionRepo;
    @Autowired private CodeforcesService codeforcesService;

    /** GET /api/questions?page=0&size=20&difficulty=EASY&topic=Arrays&sort=solved */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String difficulty,
            @RequestParam(required = false)    String topic,
            @RequestParam(required = false)    String sort) {

        Sort sortOrder = switch (sort != null ? sort : "") {
            case "solved"  -> Sort.by(Sort.Direction.DESC, "solvedCount");
            case "rating"  -> Sort.by(Sort.Direction.ASC,  "rating");
            case "newest"  -> Sort.by(Sort.Direction.DESC, "id");
            default        -> Sort.by(Sort.Direction.DESC, "solvedCount");
        };

        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sortOrder);
        Page<CodingQuestion> result = fetchFiltered(difficulty, topic, pageable);

        return ResponseEntity.ok(buildPageResponse(result));
    }

    /** GET /api/questions/topic/{topic} */
    @GetMapping("/topic/{topic}")
    public ResponseEntity<Map<String, Object>> getByTopic(
            @PathVariable String topic,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "solvedCount"));
        return ResponseEntity.ok(buildPageResponse(questionRepo.findByTopic(topic, pageable)));
    }

    /** GET /api/questions/difficulty/{level} */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<Map<String, Object>> getByDifficulty(
            @PathVariable String level,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "solvedCount"));
        return ResponseEntity.ok(buildPageResponse(questionRepo.findByDifficulty(level.toUpperCase(), pageable)));
    }

    /** GET /api/questions/search?q=two+sum */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(buildPageResponse(questionRepo.search(q.trim(), pageable)));
    }

    /** GET /api/questions/{problemCode} */
    @GetMapping("/{problemCode}")
    public ResponseEntity<CodingQuestion> getByCode(@PathVariable String problemCode) {
        return questionRepo.findByProblemCode(problemCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/questions/sync/codeforces — triggers live Codeforces sync */
    @PostMapping({"/sync/codeforces", "/sync/codechef"})
    public ResponseEntity<Map<String, Object>> sync() {
        Map<String, Object> result = codeforcesService.syncFromCodeforces();
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/questions/regenerate-descriptions
     * Rebuilds the statementPreview for every existing problem in the database
     * using the rich natural-language description generator.
     * Call this once after deploying the update to fix old "Rating: X | Tags: Y" records.
     */
    @PostMapping("/regenerate-descriptions")
    public ResponseEntity<Map<String, Object>> regenerateDescriptions() {
        long updated = codeforcesService.regenerateAllDescriptions();
        Map<String, Object> result = new HashMap<>();
        result.put("status", "OK");
        result.put("updated", updated);
        result.put("message", "Descriptions regenerated for " + updated + " problems.");
        return ResponseEntity.ok(result);
    }

    /** GET /api/questions/topics — all distinct topics with problem counts */
    @GetMapping("/topics")
    public ResponseEntity<List<Map<String, Object>>> getTopics() {
        List<String> topics = questionRepo.findAllTopics();
        List<Map<String, Object>> result = topics.stream()
                .filter(t -> t != null && !t.isBlank())
                .map(t -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", t);
                    m.put("count", questionRepo.countByTopic(t));
                    return m;
                })
                .sorted(Comparator.comparingLong(m -> -((Long) m.get("count"))))
                .toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/questions/stats */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total",     questionRepo.count());
        stats.put("easy",      questionRepo.countByDifficulty("EASY"));
        stats.put("medium",    questionRepo.countByDifficulty("MEDIUM"));
        stats.put("hard",      questionRepo.countByDifficulty("HARD"));
        stats.put("lastSynced", LocalDateTime.now().toString());
        return ResponseEntity.ok(stats);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Page<CodingQuestion> fetchFiltered(String difficulty, String topic, Pageable pageable) {
        if (difficulty != null && topic != null)
            return questionRepo.findByDifficultyAndTopic(difficulty.toUpperCase(), topic, pageable);
        if (difficulty != null)
            return questionRepo.findByDifficulty(difficulty.toUpperCase(), pageable);
        if (topic != null)
            return questionRepo.findByTopic(topic, pageable);
        return questionRepo.findAll(pageable);
    }

    private Map<String, Object> buildPageResponse(Page<CodingQuestion> page) {
        Map<String, Object> res = new HashMap<>();
        res.put("problems",       page.getContent());
        res.put("totalElements",  page.getTotalElements());
        res.put("totalPages",     page.getTotalPages());
        res.put("currentPage",    page.getNumber());
        res.put("pageSize",       page.getSize());
        res.put("hasNext",        page.hasNext());
        return res;
    }
}
