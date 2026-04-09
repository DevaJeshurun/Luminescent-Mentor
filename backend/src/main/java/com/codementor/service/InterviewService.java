package com.codementor.service;

import com.codementor.model.InterviewSession;
import com.codementor.repository.InterviewSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterviewService {

    @Autowired private InterviewSessionRepository sessionRepo;
    @Autowired private AIService aiService;

    public InterviewSession saveSession(Long userId, String type, String questions,
                                        String answers, int score) {
        String feedback = aiService.getSimpleResponse(
            "Give brief interview feedback (3 points). Type: " + type +
            "\nQuestions: " + questions + "\nAnswers: " + answers
        );
        InterviewSession session = InterviewSession.builder()
                .userId(userId).type(type).questions(questions)
                .answers(answers).feedback(feedback).score(score)
                .confidenceScore(Math.min(100, score + 10))
                .build();
        return sessionRepo.save(session);
    }

    public List<InterviewSession> getHistory(Long userId) {
        return sessionRepo.findByUserIdOrderByCompletedAtDesc(userId);
    }
}
