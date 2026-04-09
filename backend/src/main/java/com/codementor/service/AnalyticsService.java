package com.codementor.service;

import com.codementor.model.*;
import com.codementor.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class AnalyticsService {

    @Autowired private UserRepository userRepo;
    @Autowired private PracticeAttemptRepository attemptRepo;
    @Autowired private UserProgressRepository progressRepo;
    @Autowired private ChatRepository chatRepo;
    @Autowired private RoadmapTopicRepository topicRepo;

    public Map<String, Object> getDashboard(Long userId) {
        User user = userRepo.findById(userId).orElseThrow();
        List<PracticeAttempt> attempts = attemptRepo.findByUserId(userId);

        long totalSolved = attempts.stream()
                .filter(a -> "SOLVED".equalsIgnoreCase(a.getStatus()))
                .map(PracticeAttempt::getProblemId)
                .distinct()
                .count();
        long totalAttempted = attempts.size();
        long topicsCompleted = progressRepo.countByUserIdAndStatus(userId, "COMPLETED");
        long aiDoubts = chatRepo.findByUserIdOrderByUpdatedAtDesc(userId).size();

        // Derived scores (based on real user activity)
        int interviewReadiness = Math.min(100, (int)(totalSolved * 2 + topicsCompleted * 3 + user.getStreakDays()));
        int javaMastery = Math.min(100, (int)(topicsCompleted * 7));
        int dsaMastery = Math.min(100, (int)(totalSolved * 3));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("username", user.getUsername());
        data.put("xpPoints", user.getXpPoints());
        data.put("streakDays", user.getStreakDays());
        data.put("problemsSolved", totalSolved);
        data.put("totalAttempted", totalAttempted);
        data.put("topicsCompleted", topicsCompleted);
        data.put("aiDoubts", aiDoubts);
        data.put("interviewReadiness", interviewReadiness);
        data.put("javaMastery", javaMastery);
        data.put("dsaMastery", dsaMastery);
        data.put("skillLevel", user.getSkillLevel());

        // Weekly activity (last 7 days, based on attempts)
        Map<LocalDate, Set<Long>> solvedByDay = new HashMap<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);
        for (PracticeAttempt a : attempts) {
            LocalDate d = parseAttemptDate(a.getCreatedAt());
            if (d == null) continue;
            if (d.isBefore(start) || d.isAfter(today)) continue;
            if ("SOLVED".equalsIgnoreCase(a.getStatus())) {
                solvedByDay.computeIfAbsent(d, k -> new HashSet<>()).add(a.getProblemId());
            }
        }

        List<Map<String, Object>> weeklyActivity = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = start.plusDays(i);
            long solvedCount = solvedByDay.getOrDefault(d, Collections.emptySet()).size();
            long xp = solvedCount * 20;
            weeklyActivity.add(Map.of(
                    "day", dayShort(d.getDayOfWeek()),
                    "problems", solvedCount,
                    "xp", xp
            ));
        }
        data.put("weeklyActivity", weeklyActivity);

        // Topic mastery breakdown (by roadmap category, based on UserProgress)
        List<UserProgress> progress = progressRepo.findByUserId(userId);
        Map<Long, String> statusByTopicId = new HashMap<>();
        for (UserProgress p : progress) statusByTopicId.put(p.getTopicId(), p.getStatus());

        List<RoadmapTopic> topics = topicRepo.findAllByOrderByTopicOrderAsc();

        Map<String, long[]> categoryAgg = new LinkedHashMap<>();
        // Known categories from seed data
        for (String cat : List.of("FUNDAMENTALS", "DATA_STRUCTURES", "ALGORITHMS", "SYSTEM_DESIGN")) {
            categoryAgg.put(cat, new long[]{0, 0}); // [0]=completed, [1]=total
        }

        for (RoadmapTopic t : topics) {
            String cat = t.getCategory() != null ? t.getCategory().toUpperCase() : "FUNDAMENTALS";
            long[] agg = categoryAgg.computeIfAbsent(cat, k -> new long[]{0, 0});
            agg[1] += 1;
            String st = statusByTopicId.get(t.getId());
            if ("COMPLETED".equalsIgnoreCase(st)) agg[0] += 1;
        }

        List<Map<String, Object>> topicMastery = new ArrayList<>();
        for (Map.Entry<String, long[]> e : categoryAgg.entrySet()) {
            long completed = e.getValue()[0];
            long total = e.getValue()[1];
            int score = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
            topicMastery.add(Map.of("topic", prettyCategory(e.getKey()), "score", score));
        }
        data.put("topicMastery", topicMastery);

        return data;
    }

    private static LocalDate parseAttemptDate(String createdAt) {
        if (createdAt == null || createdAt.isBlank()) return null;
        try {
            return LocalDateTime.parse(createdAt).toLocalDate();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDate.parse(createdAt);
            } catch (DateTimeParseException ignored2) {
                return null;
            }
        }
    }

    private static String dayShort(DayOfWeek d) {
        return switch (d) {
            case MONDAY -> "Mon";
            case TUESDAY -> "Tue";
            case WEDNESDAY -> "Wed";
            case THURSDAY -> "Thu";
            case FRIDAY -> "Fri";
            case SATURDAY -> "Sat";
            case SUNDAY -> "Sun";
        };
    }

    private static String prettyCategory(String cat) {
        return switch (cat) {
            case "FUNDAMENTALS" -> "Fundamentals";
            case "DATA_STRUCTURES" -> "Data Structures";
            case "ALGORITHMS" -> "Algorithms";
            case "SYSTEM_DESIGN" -> "System Design";
            default -> cat;
        };
    }
}
