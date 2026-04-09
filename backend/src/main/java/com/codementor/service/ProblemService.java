package com.codementor.service;

import com.codementor.model.*;
import com.codementor.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProblemService {

    @Autowired private PracticeProblemRepository problemRepo;
    @Autowired private PracticeAttemptRepository attemptRepo;
    @Autowired private UserRepository userRepo;

    public List<PracticeProblem> getAll() { return problemRepo.findAll(); }

    public List<PracticeProblem> getByDifficulty(String diff) {
        return problemRepo.findByDifficulty(diff.toUpperCase());
    }

    public List<PracticeProblem> getByCategory(String cat) {
        return problemRepo.findByCategory(cat);
    }

    public PracticeProblem getById(Long id) {
        return problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
    }

    public PracticeAttempt submitAttempt(Long userId, Long problemId, String code, String lang, int timeTaken, boolean solved) {
        boolean alreadySolved = attemptRepo.findByUserIdAndStatus(userId, "SOLVED")
                .stream()
                .anyMatch(a -> problemId.equals(a.getProblemId()));

        PracticeAttempt attempt = PracticeAttempt.builder()
                .userId(userId).problemId(problemId)
                .code(code).language(lang).timeTaken(timeTaken)
                .status(solved ? "SOLVED" : "ATTEMPTED")
                .build();

        PracticeAttempt saved = attemptRepo.save(attempt);

        if (solved) {
            PracticeProblem p = problemRepo.findById(problemId).orElse(null);
            if (p != null) {
                p.setSolveCount(p.getSolveCount() + 1);
                problemRepo.save(p);
            }
            // Award XP and promote level only for first successful solve of that problem.
            if (!alreadySolved) {
                userRepo.findById(userId).ifPresent(user -> {
                    user.setXpPoints((user.getXpPoints() == null ? 0 : user.getXpPoints()) + 20);
                    updateStreak(user);
                    long uniqueSolved = attemptRepo.findByUserIdAndStatus(userId, "SOLVED")
                            .stream()
                            .map(PracticeAttempt::getProblemId)
                            .distinct()
                            .count();
                    user.setSkillLevel(resolveSkillLevel(uniqueSolved));
                    userRepo.save(user);
                });
            }
        }
        return saved;
    }

    public List<PracticeAttempt> getUserAttempts(Long userId) {
        return attemptRepo.findByUserId(userId);
    }

    private static String resolveSkillLevel(long solvedCount) {
        if (solvedCount >= 75) return "ADVANCED";
        if (solvedCount >= 25) return "INTERMEDIATE";
        return "BEGINNER";
    }

    private static void updateStreak(User user) {
        String today = LocalDate.now().toString();
        String last = user.getLastActiveDate();
        if (today.equals(last)) return;
        if (last == null || last.isBlank()) {
            user.setStreakDays(1);
            user.setLastActiveDate(today);
            return;
        }
        LocalDate lastDate = LocalDate.parse(last);
        int current = user.getStreakDays() == null ? 0 : user.getStreakDays();
        if (lastDate.plusDays(1).equals(LocalDate.now())) user.setStreakDays(current + 1);
        else user.setStreakDays(1);
        user.setLastActiveDate(today);
    }
}
