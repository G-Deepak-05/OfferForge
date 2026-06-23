package com.offerforge.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.offerforge.interview.ai.NvidiaNimClient;
import com.offerforge.interview.ai.PromptTemplates;
import com.offerforge.interview.model.Interview;
import com.offerforge.interview.model.Question;
import com.offerforge.interview.model.Submission;
import com.offerforge.interview.repository.SubmissionRepository;
import com.offerforge.interview.submission.Judge0ExecutionDriver;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final InterviewService interviewService;
    private final Judge0ExecutionDriver judge0Driver;
    private final NvidiaNimClient nimClient;
    private final ObjectMapper objectMapper;

    public SubmissionService(SubmissionRepository submissionRepository,
                             InterviewService interviewService,
                             Judge0ExecutionDriver judge0Driver,
                             NvidiaNimClient nimClient) {
        this.submissionRepository = submissionRepository;
        this.interviewService = interviewService;
        this.judge0Driver = judge0Driver;
        this.nimClient = nimClient;
        this.objectMapper = new ObjectMapper();
    }

    public Submission submitCode(UUID interviewId, String code, String language) {
        Interview interview = interviewService.getInterviewById(interviewId);
        Question question = interview.getCurrentQuestion();

        int passed = 0;
        int total = 0;
        int maxRuntime = 0;
        int maxMemory = 0;
        String status = "ACCEPTED";
        StringBuilder errorLog = new StringBuilder();

        try {
            // Parse sample test cases and hidden test cases
            JsonNode sampleCases = objectMapper.readTree(question.getSampleTestCases());
            JsonNode hiddenCases = objectMapper.readTree(question.getHiddenTestCases());

            // Compile/run against all cases
            passed = 0;
            total = sampleCases.size() + hiddenCases.size();

            // Evaluate sample cases
            for (JsonNode testCase : sampleCases) {
                String input = testCase.path("input").asText();
                String expected = testCase.path("expectedOutput").asText().trim();

                Judge0ExecutionDriver.Judge0Result result = judge0Driver.execute(code, language, input, expected);

                maxRuntime = Math.max(maxRuntime, result.runtimeMs());
                maxMemory = Math.max(maxMemory, result.memoryKb());

                if (result.statusId() == 3) { // Accepted
                    // Check output equivalence (ignoring trailing spaces/newlines)
                    if (result.stdout().trim().equals(expected)) {
                        passed++;
                    } else {
                        status = "WRONG_ANSWER";
                        errorLog.append(String.format("Sample Case Fail: Input [%s], Expected [%s], Got [%s]\n", input, expected, result.stdout().trim()));
                    }
                } else {
                    status = result.statusDescription().toUpperCase().replace(" ", "_");
                    errorLog.append(String.format("Compilation/Runtime Error: %s\n%s\n%s", result.statusDescription(), result.stderr(), result.compileOutput()));
                    break;
                }
            }

            // Evaluate hidden cases if sample passed
            if ("ACCEPTED".equals(status)) {
                for (JsonNode testCase : hiddenCases) {
                    String input = testCase.path("input").asText();
                    String expected = testCase.path("expectedOutput").asText().trim();

                    Judge0ExecutionDriver.Judge0Result result = judge0Driver.execute(code, language, input, expected);

                    maxRuntime = Math.max(maxRuntime, result.runtimeMs());
                    maxMemory = Math.max(maxMemory, result.memoryKb());

                    if (result.statusId() == 3) {
                        if (result.stdout().trim().equals(expected)) {
                            passed++;
                        } else {
                            status = "WRONG_ANSWER";
                            break;
                        }
                    } else {
                        status = result.statusDescription().toUpperCase().replace(" ", "_");
                        break;
                    }
                }
            }

        } catch (Exception e) {
            status = "EXECUTION_ERROR";
            errorLog.append(e.getMessage());
        }

        // Call DeepSeek R1 to evaluate code quality, complexity and comments
        double qualityScore = 7.5;
        try {
            String reviewPrompt = String.format("Analyze the user code for question '%s':\n\n```%s\n%s\n```", 
                    question.getTitle(), language, code);

            String reviewReport = nimClient.generate(
                    PromptTemplates.CODE_EVALUATION_SYSTEM,
                    reviewPrompt,
                    "deepseek-ai/deepseek-v4-flash"
            );

            // Extract SCORE: X.Y/10 from response
            if (reviewReport.contains("SCORE:")) {
                String scoreStr = reviewReport.substring(reviewReport.indexOf("SCORE:") + 6).trim();
                int slashIdx = scoreStr.indexOf("/");
                if (slashIdx != -1) {
                    scoreStr = scoreStr.substring(0, slashIdx).trim();
                    qualityScore = Double.parseDouble(scoreStr);
                }
            }
            
            // Log review output to conversation history
            interviewService.sendMessage(interviewId, "interviewer", 
                    "### Code Review & Analysis\n" + reviewReport);

        } catch (Exception e) {
            System.err.println("DeepSeek Code Review failed: " + e.getMessage());
        }

        double scorePercentage = total > 0 ? ((double) passed / total) * 100 : 0.0;

        Submission submission = Submission.builder()
                .interview(interview)
                .question(question)
                .code(code)
                .language(language)
                .status(status)
                .score(scorePercentage)
                .runtimeMs(maxRuntime)
                .memoryKb(maxMemory)
                .build();

        return submissionRepository.save(submission);
    }
}
