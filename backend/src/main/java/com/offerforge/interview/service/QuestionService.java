package com.offerforge.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.offerforge.interview.ai.NvidiaNimClient;
import com.offerforge.interview.ai.PromptTemplates;
import com.offerforge.interview.model.Question;
import com.offerforge.interview.repository.QuestionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final NvidiaNimClient nimClient;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public QuestionService(QuestionRepository questionRepository, NvidiaNimClient nimClient) {
        this.questionRepository = questionRepository;
        this.nimClient = nimClient;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void seedDefaultQuestions() {
        if (questionRepository.count() == 0) {
            System.out.println("Seeding default interview questions in database...");
            
            questionRepository.save(Question.builder()
                    .title("Two Sum")
                    .problemStatement("Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.")
                    .difficulty("Easy")
                    .topics(List.of("Arrays", "Hashing"))
                    .companies(List.of("Google", "Amazon", "Oracle", "Microsoft"))
                    .inputFormat("First line contains array size, second line contains array items, third line contains target integer.")
                    .outputFormat("Two integers representing indices of the elements.")
                    .constraints("2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9")
                    .sampleTestCases("[{\"input\": \"4\\n2 7 11 15\\n9\", \"expectedOutput\": \"0 1\"}]")
                    .hiddenTestCases("[{\"input\": \"3\\n3 2 4\\n6\", \"expectedOutput\": \"1 2\"}, {\"input\": \"2\\n3 3\\n6\", \"expectedOutput\": \"0 1\"}]")
                    .expectedApproaches("Use a HashMap to store target - nums[i] with index for O(N) time complexity.")
                    .build());

            questionRepository.save(Question.builder()
                    .title("Reverse Linked List")
                    .problemStatement("Given the head of a singly linked list, reverse the list, and return its head.")
                    .difficulty("Easy")
                    .topics(List.of("Linked List"))
                    .companies(List.of("Amazon", "Microsoft", "Flipkart"))
                    .inputFormat("First line contains node count, second line contains node values.")
                    .outputFormat("Reversed node values.")
                    .constraints("0 <= list.length <= 5000\n-5000 <= node.val <= 5000")
                    .sampleTestCases("[{\"input\": \"5\\n1 2 3 4 5\", \"expectedOutput\": \"5 4 3 2 1\"}]")
                    .hiddenTestCases("[{\"input\": \"2\\n1 2\", \"expectedOutput\": \"2 1\"}, {\"input\": \"0\\n\", \"expectedOutput\": \"\"}]")
                    .expectedApproaches("Iterative approach using three pointers (prev, curr, next) for O(N) time and O(1) space.")
                    .build());

            questionRepository.save(Question.builder()
                    .title("Longest Substring Without Repeating Characters")
                    .problemStatement("Given a string `s`, find the length of the longest substring without repeating characters.")
                    .difficulty("Medium")
                    .topics(List.of("Strings", "Sliding Window"))
                    .companies(List.of("Google", "Oracle", "Atlassian"))
                    .inputFormat("A single line containing the string.")
                    .outputFormat("Length of the longest non-repeating substring.")
                    .constraints("0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.")
                    .sampleTestCases("[{\"input\": \"abcabcbb\", \"expectedOutput\": \"3\"}]")
                    .hiddenTestCases("[{\"input\": \"bbbbb\", \"expectedOutput\": \"1\"}, {\"input\": \"pwwkew\", \"expectedOutput\": \"3\"}]")
                    .expectedApproaches("Use a sliding window with a HashMap mapping characters to their last seen index for O(N) time.")
                    .build());
        }
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Question getQuestionById(UUID id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
    }

    public Question getOrCreateQuestion(String company, String topic, String difficulty) {
        // Try to find a matching question in database first to save API tokens
        List<Question> existing = questionRepository.findAll();
        List<Question> matches = new ArrayList<>();
        
        for (Question q : existing) {
            boolean companyMatch = company == null || company.isEmpty() || q.getCompanies().stream().anyMatch(c -> c.equalsIgnoreCase(company));
            boolean topicMatch = topic == null || topic.isEmpty() || q.getTopics().stream().anyMatch(t -> t.equalsIgnoreCase(topic));
            boolean diffMatch = difficulty == null || difficulty.isEmpty() || q.getDifficulty().equalsIgnoreCase(difficulty);

            if (companyMatch && topicMatch && diffMatch) {
                matches.add(q);
            }
        }

        if (!matches.isEmpty()) {
            return matches.get(random.nextInt(matches.size()));
        }

        // If no match, generate dynamically using Llama 3.3
        String userPrompt = String.format("Company: %s, Topic: %s, Difficulty: %s", 
                (company != null && !company.isEmpty()) ? company : "General SDE Interview",
                (topic != null && !topic.isEmpty()) ? topic : "Data Structures and Algorithms",
                (difficulty != null && !difficulty.isEmpty()) ? difficulty : "Medium");

        try {
            String aiResponseJson = nimClient.generate(
                    PromptTemplates.QUESTION_GENERATOR_SYSTEM, 
                    userPrompt, 
                    "meta/llama-3.3-70b-instruct"
            );

            // Parse response
            JsonNode root = objectMapper.readTree(aiResponseJson);
            
            List<String> topicsList = new ArrayList<>();
            if (root.has("topics")) {
                root.path("topics").forEach(t -> topicsList.add(t.asText()));
            } else if (topic != null) {
                topicsList.add(topic);
            }

            List<String> companiesList = new ArrayList<>();
            if (root.has("companies")) {
                root.path("companies").forEach(c -> companiesList.add(c.asText()));
            } else if (company != null) {
                companiesList.add(company);
            }

            Question newQuestion = Question.builder()
                    .title(root.path("title").asText("Dynamic Question"))
                    .problemStatement(root.path("problemStatement").asText("Write a solution for this challenge."))
                    .difficulty(root.path("difficulty").asText(difficulty != null ? difficulty : "Medium"))
                    .topics(topicsList)
                    .companies(companiesList)
                    .inputFormat(root.path("inputFormat").asText(""))
                    .outputFormat(root.path("outputFormat").asText(""))
                    .constraints(root.path("constraints").asText(""))
                    .sampleTestCases(root.path("sampleTestCases").isTextual() ? root.path("sampleTestCases").asText() : objectMapper.writeValueAsString(root.path("sampleTestCases")))
                    .hiddenTestCases(root.path("hiddenTestCases").isTextual() ? root.path("hiddenTestCases").asText() : objectMapper.writeValueAsString(root.path("hiddenTestCases")))
                    .expectedApproaches(root.path("expectedApproaches").asText(""))
                    .build();

            return questionRepository.save(newQuestion);

        } catch (Exception e) {
            System.err.println("Failed to generate dynamic question: " + e.getMessage());
            // Fallback to random question from database
            if (!existing.isEmpty()) {
                return existing.get(random.nextInt(existing.size()));
            }
            throw new RuntimeException("No questions available in the database and dynamic generation failed.");
        }
    }
}
