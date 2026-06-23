package com.offerforge.interview.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String problemStatement;

    @Column(nullable = false)
    private String difficulty; // Easy, Medium, Hard

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_topics", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "topic")
    private List<String> topics;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_companies", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "company")
    private List<String> companies;

    @Column(columnDefinition = "TEXT")
    private String inputFormat;

    @Column(columnDefinition = "TEXT")
    private String outputFormat;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(columnDefinition = "TEXT")
    private String sampleTestCases; // JSON string of [{input, expectedOutput}]

    @Column(columnDefinition = "TEXT")
    private String hiddenTestCases; // JSON string of [{input, expectedOutput}]

    @Column(columnDefinition = "TEXT")
    private String expectedApproaches; // e.g. time, space complexities
}
