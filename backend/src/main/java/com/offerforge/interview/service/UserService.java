package com.offerforge.interview.service;

import com.offerforge.interview.model.User;
import com.offerforge.interview.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String name, String email, String password, String college, String experience, List<String> targetCompanies, List<String> preferredLanguages) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(password) // For the MVP, we store password directly (or simple hash)
                .college(college)
                .experience(experience)
                .targetCompanies(targetCompanies)
                .preferredLanguages(preferredLanguages)
                .build();

        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getPasswordHash().equals(password));
    }

    public User ssoLogin(String email, String name, String provider) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    // Create user if not exists
                    User user = User.builder()
                            .name(name)
                            .email(email)
                            .passwordHash("SSO_USER_" + provider.toUpperCase()) // Placeholder password
                            .college("Not specified")
                            .experience("Junior")
                            .targetCompanies(List.of("Google", "Oracle"))
                            .preferredLanguages(List.of("python", "javascript"))
                            .build();
                    return userRepository.save(user);
                });
    }

    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    public User updateUserProfile(UUID id, String name, String college, String experience, List<String> targetCompanies, List<String> preferredLanguages) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(name);
        user.setCollege(college);
        user.setExperience(experience);
        user.setTargetCompanies(targetCompanies);
        user.setPreferredLanguages(preferredLanguages);

        return userRepository.save(user);
    }
}

