package com.offerforge.interview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private String company; // e.g. Oracle, Google, Amazon

    private String roundType; // DSA, Behavioral, Resume-Based

    private String status; // IN_PROGRESS, COMPLETED

    @Column(columnDefinition = "TEXT")
    private String conversationHistory; // JSON string of chat history [{sender, text, timestamp}]

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_question_id")
    private Question currentQuestion;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = "IN_PROGRESS";
    }
}
