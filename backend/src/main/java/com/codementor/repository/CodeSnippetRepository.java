package com.codementor.repository;

import com.codementor.model.CodeSnippet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CodeSnippetRepository extends JpaRepository<CodeSnippet, Long> {
    List<CodeSnippet> findByUserIdOrderByCreatedAtDesc(Long userId);
}
