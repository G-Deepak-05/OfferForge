package com.offerforge.interview.controller;

import com.offerforge.interview.model.Question;
import com.offerforge.interview.service.QuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(questionService.getQuestionById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<Question> getOrCreateQuestion(
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty) {
        Question question = questionService.getOrCreateQuestion(company, topic, difficulty);
        return ResponseEntity.ok(question);
    }
}
