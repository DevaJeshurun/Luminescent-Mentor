package com.codementor.repository;

import com.codementor.model.CodingQuestion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CodingQuestionRepository extends JpaRepository<CodingQuestion, Long> {

    Optional<CodingQuestion> findByProblemCode(String problemCode);

    Page<CodingQuestion> findByDifficulty(String difficulty, Pageable pageable);

    Page<CodingQuestion> findByTopic(String topic, Pageable pageable);

    Page<CodingQuestion> findByDifficultyAndTopic(String difficulty, String topic, Pageable pageable);

    @Query("SELECT q FROM CodingQuestion q WHERE " +
           "LOWER(q.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(q.tags) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(q.topic) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<CodingQuestion> search(@Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT q.topic FROM CodingQuestion q WHERE q.topic IS NOT NULL ORDER BY q.topic")
    List<String> findAllTopics();

    Long countByDifficulty(String difficulty);

    Long countByTopic(String topic);
}
