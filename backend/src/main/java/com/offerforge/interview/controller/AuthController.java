package com.offerforge.interview.controller;

import com.offerforge.interview.model.User;
import com.offerforge.interview.service.UserService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getCollege(),
                    request.getExperience(),
                    request.getTargetCompanies(),
                    request.getPreferredLanguages()
            );
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userService.login(request.getEmail(), request.getPassword());
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }

    @PostMapping("/sso")
    public ResponseEntity<?> ssoLogin(@RequestBody SsoRequest request) {
        User user = userService.ssoLogin(request.getEmail(), request.getName(), request.getProvider());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable UUID id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/user/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable UUID id, @RequestBody UpdateProfileRequest request) {
        try {
            User user = userService.updateUserProfile(
                    id,
                    request.getName(),
                    request.getCollege(),
                    request.getExperience(),
                    request.getTargetCompanies(),
                    request.getPreferredLanguages(),
                    request.getResumeText()
            );
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/user/{id}/credits")
    public ResponseEntity<?> addCredits(@PathVariable UUID id, @RequestParam int amount) {
        try {
            User user = userService.addCredits(id, amount);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String college;
        private String experience;
        private List<String> targetCompanies;
        private List<String> preferredLanguages;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class SsoRequest {
        private String email;
        private String name;
        private String provider; // e.g. "google", "github"
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
        private String college;
        private String experience;
        private List<String> targetCompanies;
        private List<String> preferredLanguages;
        private String resumeText;
    }
}
