package com.offerforge.interview.controller;

import com.offerforge.interview.ai.NvidiaNimClient;
import com.offerforge.interview.ai.PromptTemplates;
import com.offerforge.interview.model.User;
import com.offerforge.interview.repository.UserRepository;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/copilot")
@CrossOrigin(origins = "*")
public class CopilotController {

    private final UserRepository userRepository;
    private final NvidiaNimClient nimClient;

    public CopilotController(UserRepository userRepository, NvidiaNimClient nimClient) {
        this.userRepository = userRepository;
        this.nimClient = nimClient;
    }

    @PostMapping("/suggest")
    public ResponseEntity<?> getCopilotSuggestion(@RequestBody CopilotRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCredits() == null || user.getCredits() <= 0) {
            return ResponseEntity.status(402).body("Insufficient credits. Please add credits to your account.");
        }

        // Deduct 1 credit
        user.setCredits(user.getCredits() - 1);
        userRepository.save(user);

        String resume = user.getResumeText();
        if (resume == null || resume.trim().isEmpty()) {
            resume = "No resume provided. Candidate profile Name: " + user.getName() + 
                     ", Experience: " + user.getExperience() + 
                     ", Target Companies: " + user.getTargetCompanies();
        }

        String systemPrompt = PromptTemplates.COPILOT_SYSTEM
                .replace("{company}", request.getCompany() != null ? request.getCompany() : "Target Company")
                .replace("{roundType}", request.getRoundType() != null ? request.getRoundType() : "General Interview")
                .replace("{resumeText}", resume)
                .replace("{questionText}", request.getQuestionText());

        try {
            // Replicating Parakeet: Call deepseek-v4-flash for ultra-fast live suggestions
            String suggestion = nimClient.generate(
                    systemPrompt,
                    "Provide live suggestion for the interviewer's question: " + request.getQuestionText(),
                    "deepseek-ai/deepseek-v4-flash"
            );

            CopilotResponse response = new CopilotResponse();
            response.setSuggestion(suggestion);
            response.setRemainingCredits(user.getCredits());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to call Copilot AI Engine: " + e.getMessage());
        }
    }

    @Data
    public static class CopilotRequest {
        private UUID userId;
        private String company;
        private String roundType;
        private String questionText;
    }

    @Data
    public static class CopilotResponse {
        private String suggestion;
        private int remainingCredits;
    }
}
