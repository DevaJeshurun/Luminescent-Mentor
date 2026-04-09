package com.codementor.repository;

import com.codementor.model.PracticeProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PracticeProblemRepository extends JpaRepository<PracticeProblem, Long> {
    List<PracticeProblem> findByDifficulty(String difficulty);
    List<PracticeProblem> findByCategory(String category);
    List<PracticeProblem> findByDifficultyAndCategory(String difficulty, String category);
}
