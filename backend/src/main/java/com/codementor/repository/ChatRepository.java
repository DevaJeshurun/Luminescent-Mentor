package com.codementor.repository;

import com.codementor.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    List<Chat> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
