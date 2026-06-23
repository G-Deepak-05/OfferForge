package com.offerforge.interview.repository;

import com.offerforge.interview.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByDifficulty(String difficulty);

    @Query("SELECT q FROM Question q JOIN q.topics t WHERE t = :topic")
    List<Question> findByTopic(@Param("topic") String topic);

    @Query("SELECT q FROM Question q JOIN q.companies c WHERE c = :company")
    List<Question> findByCompany(@Param("company") String company);
}
