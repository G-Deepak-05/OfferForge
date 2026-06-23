package com.offerforge.interview.service;

import com.offerforge.interview.model.Feedback;
import com.offerforge.interview.model.Interview;
import com.offerforge.interview.model.Submission;
import com.offerforge.interview.repository.FeedbackRepository;
import com.offerforge.interview.repository.InterviewRepository;
import com.offerforge.interview.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final InterviewRepository interviewRepository;
    private final SubmissionRepository submissionRepository;
    private final FeedbackRepository feedbackRepository;

    public AnalyticsService(InterviewRepository interviewRepository,
                            SubmissionRepository submissionRepository,
                            FeedbackRepository feedbackRepository) {
        this.interviewRepository = interviewRepository;
        this.submissionRepository = submissionRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public Map<String, Object> getUserAnalytics(UUID userId) {
        List<Interview> interviews = interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        double totalScoreSum = 0;
        int completedCount = 0;
        
        List<Feedback> feedbacks = new ArrayList<>();
        List<Submission> submissions = new ArrayList<>();

        for (Interview interview : interviews) {
            if ("COMPLETED".equals(interview.getStatus())) {
                completedCount++;
                Optional<Feedback> fbOpt = feedbackRepository.findByInterviewId(interview.getId());
                if (fbOpt.isPresent()) {
                    Feedback fb = fbOpt.get();
                    feedbacks.add(fb);
                    totalScoreSum += fb.getOverallScore();
                }
            }
            submissions.addAll(submissionRepository.findByInterviewId(interview.getId()));
        }

        double averageScore = completedCount > 0 ? totalScoreSum / completedCount : 0.0;

        // Submissions Accuracy
        long totalSubmissions = submissions.size();
        long passedSubmissions = submissions.stream().filter(s -> "ACCEPTED".equals(s.getStatus())).count();
        double accuracy = totalSubmissions > 0 ? ((double) passedSubmissions / totalSubmissions) * 100 : 0.0;

        // Strengths & Weaknesses by topic
        Map<String, List<Double>> topicScores = new HashMap<>();
        for (Submission sub : submissions) {
            List<String> topics = sub.getQuestion().getTopics();
            double subScore = sub.getScore(); // 0 to 100
            for (String topic : topics) {
                topicScores.computeIfAbsent(topic, k -> new ArrayList<>()).add(subScore);
            }
        }

        List<String> strongTopics = new ArrayList<>();
        List<String> weakTopics = new ArrayList<>();

        topicScores.forEach((topic, scores) -> {
            double avgTopicScore = scores.stream().mapToDouble(val -> val).average().orElse(0.0);
            if (avgTopicScore >= 75.0) {
                strongTopics.add(topic);
            } else {
                weakTopics.add(topic);
            }
        });

        // Weekly progress chart metrics (aggregated from database timestamps)
        List<Map<String, Object>> weeklyProgress = new ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        
        for (int i = 3; i >= 0; i--) {
            java.time.LocalDateTime start = now.minusDays((i + 1) * 7);
            java.time.LocalDateTime end = now.minusDays(i * 7);
            
            long completedInWeek = interviews.stream()
                .filter(intv -> "COMPLETED".equals(intv.getStatus()) && intv.getCompletedAt() != null 
                    && !intv.getCompletedAt().isBefore(start) && intv.getCompletedAt().isBefore(end))
                .count();
                
            long solvedInWeek = submissions.stream()
                .filter(sub -> "ACCEPTED".equals(sub.getStatus()) && sub.getCreatedAt() != null
                    && !sub.getCreatedAt().isBefore(start) && sub.getCreatedAt().isBefore(end))
                .count();
                
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("week", "Week " + (4 - i));
            dataPoint.put("interviewsCompleted", completedInWeek);
            dataPoint.put("problemsSolved", solvedInWeek);
            weeklyProgress.add(dataPoint);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalInterviews", interviews.size());
        analytics.put("completedInterviews", completedCount);
        analytics.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
        analytics.put("accuracy", Math.round(accuracy * 10.0) / 10.0);
        analytics.put("strongTopics", strongTopics);
        analytics.put("weakTopics", weakTopics);
        analytics.put("weeklyProgress", weeklyProgress);

        return analytics;
    }
}
