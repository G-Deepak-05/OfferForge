package com.offerforge.interview.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String college;
    
    private String experience; // e.g., "Student", "Junior", "Senior"

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_companies", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "company")
    private List<String> targetCompanies;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "language")
    private List<String> preferredLanguages;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
