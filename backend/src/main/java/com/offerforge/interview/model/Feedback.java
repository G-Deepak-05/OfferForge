package com.offerforge.interview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "feedback")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false, unique = true)
    @JsonIgnore
    private Interview interview;

    private Double overallScore; // 0 to 100

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "feedback_strengths", joinColumns = @JoinColumn(name = "feedback_id"))
    @Column(name = "strength")
    private List<String> strengths;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "feedback_weaknesses", joinColumns = @JoinColumn(name = "feedback_id"))
    @Column(name = "weakness")
    private List<String> weaknesses;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    private String timeComplexity; // O(...)
    private String spaceComplexity; // O(...)

    private Double codeQualityScore; // 0 to 10

    @Column(columnDefinition = "TEXT")
    private String timelineReplay; // JSON string of timeline replay [{time, eventType, description}]

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
