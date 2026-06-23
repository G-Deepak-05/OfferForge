package com.offerforge.interview.controller;

import com.offerforge.interview.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserAnalytics(@PathVariable UUID userId) {
        Map<String, Object> analytics = analyticsService.getUserAnalytics(userId);
        return ResponseEntity.ok(analytics);
    }
}
