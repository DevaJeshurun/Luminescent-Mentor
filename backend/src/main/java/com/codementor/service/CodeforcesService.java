package com.codementor.service;

import com.codementor.model.CodingQuestion;
import com.codementor.repository.CodingQuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CodeforcesService {

    private static final Logger log = LoggerFactory.getLogger(CodeforcesService.class);
    private static final String CF_API = "https://codeforces.com/api/problemset.problems";

    @Autowired
    private CodingQuestionRepository questionRepo;

    private final ObjectMapper mapper = new ObjectMapper();
    // RestTemplate with 30 s connect + 60 s read timeout so a slow/rate-limited
    // Codeforces response doesn't block the server thread forever.
    private final RestTemplate restTemplate;

    public CodeforcesService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(90_000);   // 90 s connect (was 30 s)
        factory.setReadTimeout(180_000);      // 3 min read  (was 60 s)
        this.restTemplate = new RestTemplate(factory);
    }

    // Ordered map: first matching tag wins as primary topic
    private static final Map<String, String> TAG_TO_TOPIC = new LinkedHashMap<>();
    static {
        TAG_TO_TOPIC.put("two pointers",        "Two Pointer");
        TAG_TO_TOPIC.put("binary search",        "Binary Search");
        TAG_TO_TOPIC.put("sliding window",       "Sliding Window");
        TAG_TO_TOPIC.put("dynamic programming",  "Dynamic Programming");
        TAG_TO_TOPIC.put("dp",                   "Dynamic Programming");
        TAG_TO_TOPIC.put("greedy",               "Greedy");
        TAG_TO_TOPIC.put("graphs",               "Graph");
        TAG_TO_TOPIC.put("dfs and similar",      "Graph");
        TAG_TO_TOPIC.put("shortest paths",       "Graph");
        TAG_TO_TOPIC.put("trees",                "Trees");
        TAG_TO_TOPIC.put("binary search tree",   "BST");
        TAG_TO_TOPIC.put("data structures",      "Data Structures");
        TAG_TO_TOPIC.put("heaps",                "Heap");
        TAG_TO_TOPIC.put("strings",              "Strings");
        TAG_TO_TOPIC.put("hashing",              "Hashing");
        TAG_TO_TOPIC.put("backtracking",         "Backtracking");
        TAG_TO_TOPIC.put("recursion",            "Recursion");
        TAG_TO_TOPIC.put("bit manipulation",     "Bit Manipulation");
        TAG_TO_TOPIC.put("number theory",        "Math");
        TAG_TO_TOPIC.put("math",                 "Math");
        TAG_TO_TOPIC.put("sorting",              "Sorting");
        TAG_TO_TOPIC.put("brute force",          "Brute Force");
        TAG_TO_TOPIC.put("linked list",          "Linked List");
        TAG_TO_TOPIC.put("stacks",               "Stack");
        TAG_TO_TOPIC.put("queues",               "Queue");
        TAG_TO_TOPIC.put("arrays",               "Arrays");
        TAG_TO_TOPIC.put("implementation",       "Implementation");
    }

    public Map<String, Object> syncFromCodeforces() {
        try {
            log.info("Starting Codeforces sync from {}...", CF_API);
            String json = fetchCodeforcesJson();
            JsonNode root = mapper.readTree(json);

            if (!"OK".equals(root.path("status").asText())) {
                String msg = root.path("comment").asText("Codeforces returned non-OK status");
                log.error("Codeforces API error: {}", msg);
                return Map.of("status", "ERROR", "message", msg);
            }

            JsonNode problems = root.path("result").path("problems");
            JsonNode statsNode = root.path("result").path("problemStatistics");

            // Build solved count map keyed by contestId+index (e.g. "1A")
            Map<String, Integer> solvedMap = new HashMap<>();
            if (statsNode.isArray()) {
                for (JsonNode s : statsNode) {
                    String key = s.path("contestId").asText() + s.path("index").asText();
                    solvedMap.put(key, s.path("solvedCount").asInt(0));
                }
            }

            int added = 0, updated = 0, skipped = 0;

            if (problems.isArray()) {
                for (JsonNode p : problems) {
                    try {
                        int contestId = p.path("contestId").asInt(0);
                        String index = p.path("index").asText("").trim();
                        String code = contestId + index;
                        String title = p.path("name").asText("Unknown").trim();
                        int rating = p.path("rating").asInt(0);

                        // Skip unrated problems
                        if (rating == 0 || contestId == 0 || title.isEmpty()) {
                            skipped++;
                            continue;
                        }

                        // Collect all tags
                        List<String> rawTags = new ArrayList<>();
                        for (JsonNode t : p.path("tags")) {
                            rawTags.add(t.asText());
                        }

                        // Determine primary DSA topic
                        String primaryTopic = "Implementation";
                        for (String rawTag : rawTags) {
                            String lower = rawTag.toLowerCase();
                            if (TAG_TO_TOPIC.containsKey(lower)) {
                                primaryTopic = TAG_TO_TOPIC.get(lower);
                                break;
                            }
                        }

                        String difficulty = ratingToDifficulty(rating);
                        String tags = String.join(", ", rawTags);
                        String sourceUrl = "https://codeforces.com/problemset/problem/" + contestId + "/" + index;
                        int solved = solvedMap.getOrDefault(code, 0);
                        String preview = buildDescription(title, primaryTopic, difficulty, rating, rawTags, solved);

                        Optional<CodingQuestion> existing = questionRepo.findByProblemCode(code);
                        if (existing.isPresent()) {
                            CodingQuestion q = existing.get();
                            // Keep existing rows fully in sync with upstream fields.
                            q.setTitle(title);
                            q.setTopic(primaryTopic);
                            q.setDifficulty(difficulty);
                            q.setTags(tags);
                            q.setSourceUrl(sourceUrl);
                            q.setPlatform("Codeforces");
                            q.setSolvedCount(solved);
                            q.setStatementPreview(preview);
                            q.setRating(rating);
                            q.setContestId(contestId);
                            questionRepo.save(q);
                            updated++;
                        } else {
                            CodingQuestion q = CodingQuestion.builder()
                                    .problemCode(code)
                                    .title(title)
                                    .topic(primaryTopic)
                                    .difficulty(difficulty)
                                    .tags(tags)
                                    .sourceUrl(sourceUrl)
                                    .platform("Codeforces")
                                    .solvedCount(solved)
                                    .statementPreview(preview)
                                    .rating(rating)
                                    .contestId(contestId)
                                    .createdAt(LocalDateTime.now())
                                    .build();
                            questionRepo.save(q);
                            added++;
                        }
                    } catch (Exception e) {
                        log.warn("Skipping problem due to error: {}", e.getMessage());
                        skipped++;
                    }
                }
            }

            long total = questionRepo.count();
            log.info("Codeforces sync complete — added={}, updated={}, skipped={}, total={}", added, updated, skipped, total);
            return Map.of(
                    "status", "OK",
                    "added", added,
                    "updated", updated,
                    "skipped", skipped,
                    "total", total,
                    "syncedAt", LocalDateTime.now().toString()
            );

        } catch (Exception e) {
            log.error("Codeforces sync failed: {}", e.getMessage(), e);
            return Map.of("status", "ERROR", "message", e.getMessage());
        }
    }

    private String fetchCodeforcesJson() {
        int maxAttempts = 3;
        Exception lastEx = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setAccept(List.of(MediaType.APPLICATION_JSON));
                headers.set("User-Agent", "CodeMentorAI/1.0 (https://localhost)");
                headers.set("Accept-Language", "en-US,en;q=0.9");
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(CF_API, HttpMethod.GET, entity, String.class);
                return response.getBody() == null ? "{}" : response.getBody();
            } catch (HttpClientErrorException | HttpServerErrorException ex) {
                log.error("Codeforces HTTP error {} (attempt {}/{}): {} — may be rate-limited.",
                        ex.getStatusCode(), attempt, maxAttempts, ex.getMessage());
                lastEx = ex;
                // Don't retry on 4xx client errors (e.g. 403 ban), only on 5xx
                if (ex.getStatusCode().is4xxClientError()) break;
            } catch (Exception ex) {
                log.warn("Codeforces fetch attempt {}/{} failed: {}", attempt, maxAttempts, ex.getMessage());
                lastEx = ex;
            }
            if (attempt < maxAttempts) {
                try { Thread.sleep(5_000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
            }
        }
        throw new RuntimeException("Cannot reach Codeforces API after " + maxAttempts + " attempts: "
                + (lastEx != null ? lastEx.getMessage() : "unknown"), lastEx);
    }

    private String ratingToDifficulty(int rating) {
        if (rating <= 1200) return "EASY";
        if (rating <= 1900) return "MEDIUM";
        return "HARD";
    }

    /**
     * Builds a human-readable description for a Codeforces problem
     * using all available metadata from the API response.
     */
    private String buildDescription(String title, String topic, String difficulty,
                                    int rating, List<String> tags, int solved) {
        StringBuilder sb = new StringBuilder();

        // Opening sentence – difficulty + title + rating
        String levelWord;
        switch (difficulty) {
            case "EASY":   levelWord = "beginner-friendly"; break;
            case "MEDIUM": levelWord = "intermediate";      break;
            default:       levelWord = "advanced";          break;
        }
        sb.append(title)
          .append(" is a ").append(levelWord)
          .append(" Codeforces problem (CF Rating: ").append(rating).append("). ");

        // Topic sentence
        String topicSentence = topicDescription(topic);
        sb.append(topicSentence).append(" ");

        // Key concepts from tags
        if (!tags.isEmpty()) {
            sb.append("Key concepts: ").append(String.join(", ", tags)).append(". ");
        }

        // Popularity
        if (solved > 0) {
            String solvedStr;
            if (solved >= 1_000_000)     solvedStr = (solved / 1_000_000) + "M+";
            else if (solved >= 1_000)    solvedStr = (solved / 1_000)     + "k+";
            else                         solvedStr = String.valueOf(solved);
            sb.append("Accepted by ").append(solvedStr).append(" users on Codeforces.");
        } else {
            sb.append("Try to solve this problem and join the community!");
        }

        return sb.toString();
    }

    /**
     * Returns a short explanatory sentence for the given DSA topic.
     */
    private String topicDescription(String topic) {
        switch (topic) {
            case "Dynamic Programming":  return "It falls under Dynamic Programming, requiring you to break the problem into overlapping subproblems and memoize results for efficiency.";
            case "Greedy":               return "It is a Greedy algorithm problem where locally optimal choices lead to a globally optimal solution.";
            case "Graph":                return "It involves Graph traversal or shortest-path techniques such as BFS, DFS, or Dijkstra's algorithm.";
            case "Binary Search":        return "It requires Binary Search to efficiently locate a value or boundary within a sorted search space.";
            case "Two Pointer":          return "It uses the Two Pointer technique to process a sequence with two indices moving toward each other or in the same direction.";
            case "Sliding Window":       return "It applies a Sliding Window approach to maintain a running window of elements and achieve linear time complexity.";
            case "Trees":                return "It is a Tree problem that tests your understanding of hierarchical data structures, traversals, and tree properties.";
            case "BST":                  return "It involves Binary Search Trees, requiring efficient insertion, deletion, or lookup operations.";
            case "Heap":                 return "It uses a Heap (priority queue) to efficiently retrieve the minimum or maximum element.";
            case "Strings":              return "It is a String manipulation problem involving pattern matching, parsing, or character frequency analysis.";
            case "Hashing":              return "It leverages Hashing to achieve fast lookups, counting, or duplicate detection.";
            case "Backtracking":         return "It uses Backtracking to explore all possible solutions and prune invalid paths early.";
            case "Bit Manipulation":     return "It requires Bit Manipulation – working directly with binary representations for efficient computation.";
            case "Math":                 return "It is a Mathematics problem involving number theory, modular arithmetic, or combinatorics.";
            case "Sorting":              return "It requires designing or applying a Sorting strategy to order elements efficiently.";
            case "Recursion":            return "It is solved via Recursion, breaking a problem into smaller instances of the same problem.";
            case "Brute Force":          return "It can be solved with a Brute Force approach by iterating over all possible candidates.";
            case "Linked List":          return "It involves Linked List operations such as traversal, reversal, or pointer manipulation.";
            case "Stack":                return "It uses a Stack (LIFO) data structure to track state or evaluate expressions.";
            case "Queue":                return "It uses a Queue (FIFO) data structure, often for BFS-style level-order processing.";
            case "Arrays":               return "It is an Array problem that tests your ability to index, traverse, or transform linear sequences efficiently.";
            case "Data Structures":      return "It requires choosing and applying the right Data Structure to store and query data efficiently.";
            default:                     return "It is an Implementation problem that tests your ability to translate problem logic directly into clean code.";
        }
    }

    /**
     * Iterates every CodingQuestion in the database and regenerates its
     * statementPreview using the rich buildDescription() helper.
     * Returns the number of records updated.
     */
    public long regenerateAllDescriptions() {
        List<CodingQuestion> all = questionRepo.findAll();
        log.info("Regenerating descriptions for {} problems...", all.size());
        long count = 0;
        for (CodingQuestion q : all) {
            try {
                List<String> tagList = new ArrayList<>();
                if (q.getTags() != null && !q.getTags().isBlank()) {
                    for (String t : q.getTags().split(",")) {
                        String trimmed = t.trim();
                        if (!trimmed.isEmpty()) tagList.add(trimmed);
                    }
                }
                String desc = buildDescription(
                        q.getTitle()      != null ? q.getTitle()      : "Unknown",
                        q.getTopic()      != null ? q.getTopic()      : "Implementation",
                        q.getDifficulty() != null ? q.getDifficulty() : "EASY",
                        q.getRating()     != null ? q.getRating()     : 0,
                        tagList,
                        q.getSolvedCount() != null ? q.getSolvedCount() : 0
                );
                q.setStatementPreview(desc);
                questionRepo.save(q);
                count++;
            } catch (Exception e) {
                log.warn("Could not regenerate description for {}: {}", q.getProblemCode(), e.getMessage());
            }
        }
        log.info("Regenerated descriptions for {} / {} problems.", count, all.size());
        return count;
    }

    /** Scheduled daily sync at 2 AM */
    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledSync() {
        log.info("Running scheduled Codeforces sync...");
        syncFromCodeforces();
    }
}
