package com.offerforge.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.offerforge.interview.ai.NvidiaNimClient;
import com.offerforge.interview.ai.PromptTemplates;
import com.offerforge.interview.model.*;
import com.offerforge.interview.repository.FeedbackRepository;
import com.offerforge.interview.repository.InterviewRepository;
import com.offerforge.interview.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final QuestionService questionService;
    private final FeedbackRepository feedbackRepository;
    private final NvidiaNimClient nimClient;
    private final ObjectMapper objectMapper;

    public InterviewService(InterviewRepository interviewRepository,
                            UserRepository userRepository,
                            QuestionService questionService,
                            FeedbackRepository feedbackRepository,
                            NvidiaNimClient nimClient) {
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.questionService = questionService;
        this.feedbackRepository = feedbackRepository;
        this.nimClient = nimClient;
        this.objectMapper = new ObjectMapper();
    }

    public Interview startInterview(UUID userId, String company, String roundType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Select or generate a question for this session
        String topic = "Arrays"; // Default to Arrays for the first question
        String difficulty = "Medium";
        Question question = questionService.getOrCreateQuestion(company, topic, difficulty);

        // Welcome message structure
        String initialMsg = String.format("Hello %s. Today's interview focuses on Data Structures and Algorithms. Let's start. "
                + "Here is your question asked at %s:\n\n### %s\n\n%s\n\n**Input Format:** %s\n\n**Output Format:** %s\n\n**Constraints:**\n%s\n\n"
                + "Explain your approach before coding.", user.getName(), company, question.getTitle(),
                question.getProblemStatement(), question.getInputFormat(), question.getOutputFormat(), question.getConstraints());

        ArrayNode historyNode = objectMapper.createArrayNode();
        ObjectNode initialMsgObj = objectMapper.createObjectNode();
        initialMsgObj.put("sender", "interviewer");
        initialMsgObj.put("text", initialMsg);
        initialMsgObj.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        historyNode.add(initialMsgObj);

        Interview interview = Interview.builder()
                .user(user)
                .company(company)
                .roundType(roundType)
                .currentQuestion(question)
                .conversationHistory(historyNode.toString())
                .status("IN_PROGRESS")
                .build();

        return interviewRepository.save(interview);
    }

    public String sendMessage(UUID interviewId, String sender, String text) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview session not found"));

        try {
            ArrayNode historyNode = (ArrayNode) objectMapper.readTree(interview.getConversationHistory());
            
            // Add user's message
            ObjectNode userMsgObj = objectMapper.createObjectNode();
            userMsgObj.put("sender", sender);
            userMsgObj.put("text", text);
            userMsgObj.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            historyNode.add(userMsgObj);

            // If it's a message from the candidate, generate AI response
            String aiResponse = "";
            if (sender.equalsIgnoreCase("candidate")) {
                String systemPrompt = PromptTemplates.INTERVIEWER_CONVERSATION_SYSTEM
                        .replace("{name}", interview.getUser().getName())
                        .replace("{company}", interview.getCompany())
                        .replace("{topic}", "DSA")
                        .replace("{difficulty}", interview.getCurrentQuestion().getDifficulty())
                        .replace("{questionTitle}", interview.getCurrentQuestion().getTitle());

                // Feed full conversation logs for context
                StringBuilder chatHistoryBuilder = new StringBuilder();
                historyNode.forEach(msg -> chatHistoryBuilder.append(msg.path("sender").asText())
                        .append(": ").append(msg.path("text").asText()).append("\n"));

                aiResponse = nimClient.generate(
                        systemPrompt,
                        chatHistoryBuilder.toString(),
                        "meta/llama-3.3-70b-instruct"
                );

                // Add AI's response to history
                ObjectNode aiMsgObj = objectMapper.createObjectNode();
                aiMsgObj.put("sender", "interviewer");
                aiMsgObj.put("text", aiResponse);
                aiMsgObj.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                historyNode.add(aiMsgObj);
            }

            interview.setConversationHistory(historyNode.toString());
            interviewRepository.save(interview);

            return aiResponse;
        } catch (Exception e) {
            throw new RuntimeException("Error processing chat message: " + e.getMessage());
        }
    }

    public Feedback endInterview(UUID interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview session not found"));

        if ("COMPLETED".equals(interview.getStatus())) {
            return feedbackRepository.findByInterviewId(interviewId)
                    .orElseThrow(() -> new RuntimeException("Feedback not found for completed interview"));
        }

        try {
            // Collect context
            String chatHistoryText = interview.getConversationHistory();
            
            String userPrompt = String.format("Analyze the following interview data for %s:\n"
                            + "Question: %s\n"
                            + "Chat History:\n%s\n",
                    interview.getUser().getName(), interview.getCurrentQuestion().getTitle(), chatHistoryText);

            String feedbackReportJson = nimClient.generate(
                    PromptTemplates.OVERALL_FEEDBACK_SYSTEM,
                    userPrompt,
                    "meta/llama-3.3-70b-instruct"
            );

            // Parse response
            JsonNode root = objectMapper.readTree(feedbackReportJson);

            List<String> strengths = new ArrayList<>();
            root.path("strengths").forEach(s -> strengths.add(s.asText()));

            List<String> weaknesses = new ArrayList<>();
            root.path("weaknesses").forEach(w -> weaknesses.add(w.asText()));

            String timelineJson = root.path("timelineReplay").isMissingNode() ? "[]" : 
                    (root.path("timelineReplay").isTextual() ? root.path("timelineReplay").asText() : objectMapper.writeValueAsString(root.path("timelineReplay")));

            Feedback feedback = Feedback.builder()
                    .interview(interview)
                    .overallScore(root.path("overallScore").asDouble(75.0))
                    .strengths(strengths)
                    .weaknesses(weaknesses)
                    .recommendations(root.path("recommendations").asText("Keep practicing standard DSA problems."))
                    .timeComplexity(root.path("timeComplexity").asText("N/A"))
                    .spaceComplexity(root.path("spaceComplexity").asText("N/A"))
                    .codeQualityScore(root.path("codeQualityScore").asDouble(7.5))
                    .timelineReplay(timelineJson)
                    .build();

            // Save entities
            feedbackRepository.save(feedback);

            interview.setStatus("COMPLETED");
            interview.setCompletedAt(LocalDateTime.now());
            interviewRepository.save(interview);

            return feedback;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate AI feedback for the interview: " + e.getMessage(), e);
        }
    }

    public List<Interview> getUserInterviews(UUID userId) {
        return interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Interview getInterviewById(UUID id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview session not found"));
    }
}
