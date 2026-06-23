package com.offerforge.interview.controller;

import com.offerforge.interview.model.Submission;
import com.offerforge.interview.service.SubmissionService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping
    public ResponseEntity<?> submitCode(@RequestBody CodeSubmissionRequest request) {
        try {
            Submission submission = submissionService.submitCode(
                    request.getInterviewId(),
                    request.getCode(),
                    request.getLanguage()
            );
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error submitting code: " + e.getMessage());
        }
    }

    @Data
    public static class CodeSubmissionRequest {
        private UUID interviewId;
        private String code;
        private String language;
    }
}
