package com.offerforge.interview.controller;

import com.offerforge.interview.model.Feedback;
import com.offerforge.interview.model.Interview;
import com.offerforge.interview.service.InterviewService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/start")
    public ResponseEntity<Interview> startInterview(@RequestBody StartInterviewRequest request) {
        Interview interview = interviewService.startInterview(
                request.getUserId(),
                request.getCompany(),
                request.getRoundType()
        );
        return ResponseEntity.ok(interview);
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<String> sendMessage(@PathVariable UUID id, @RequestBody ChatMessageRequest request) {
        String response = interviewService.sendMessage(id, request.getSender(), request.getText());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<Feedback> endInterview(@PathVariable UUID id) {
        Feedback feedback = interviewService.endInterview(id);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Interview> getInterviewById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(interviewService.getInterviewById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Interview>> getUserInterviews(@PathVariable UUID userId) {
        return ResponseEntity.ok(interviewService.getUserInterviews(userId));
    }

    @Data
    public static class StartInterviewRequest {
        private UUID userId;
        private String company;
        private String roundType; // DSA, Behavioral
    }

    @Data
    public static class ChatMessageRequest {
        private String sender; // candidate, interviewer
        private String text;
    }
}
