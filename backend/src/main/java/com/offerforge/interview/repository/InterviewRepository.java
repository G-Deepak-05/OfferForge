package com.offerforge.interview.repository;

import com.offerforge.interview.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    List<Interview> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
