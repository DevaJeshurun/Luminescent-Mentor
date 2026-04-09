package com.codementor.repository;

import com.codementor.model.RoadmapTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadmapTopicRepository extends JpaRepository<RoadmapTopic, Long> {
    List<RoadmapTopic> findAllByOrderByTopicOrderAsc();
}
