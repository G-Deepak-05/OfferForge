package com.offerforge.interview.submission;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;

@Service
public class Judge0ExecutionDriver {

    private final String judge0Url;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public Judge0ExecutionDriver(@Value("${judge0.api-url:http://localhost:2358}") String judge0Url) {
        this.judge0Url = judge0Url;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public static int getLanguageId(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> 62;
            case "python", "py" -> 71;
            case "cpp", "c++" -> 54;
            case "go" -> 60;
            case "javascript", "js" -> 63;
            default -> 71;
        };
    }

    public Judge0Result execute(String sourceCode, String language, String stdin, String expectedOutput) {
        try {
            int languageId = getLanguageId(language);

            // Encode parameters in Base64
            String base64Source = Base64.getEncoder().encodeToString(sourceCode.getBytes());
            String base64Stdin = stdin != null ? Base64.getEncoder().encodeToString(stdin.getBytes()) : "";
            String base64Expected = expectedOutput != null ? Base64.getEncoder().encodeToString(expectedOutput.getBytes()) : "";

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("source_code", base64Source);
            requestBody.put("language_id", languageId);
            requestBody.put("stdin", base64Stdin);
            requestBody.put("expected_output", base64Expected);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(judge0Url + "/submissions?wait=true&base64_encoded=true"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                JsonNode root = objectMapper.readTree(response.body());
                
                String stdout = decodeBase64(root.path("stdout").asText(""));
                String stderr = decodeBase64(root.path("stderr").asText(""));
                String compileOutput = decodeBase64(root.path("compile_output").asText(""));
                
                double time = root.path("time").asDouble(0.0);
                int memory = root.path("memory").asInt(0);
                
                int statusId = root.path("status").path("id").asInt(0);
                String statusDescription = root.path("status").path("description").asText("Unknown");

                return new Judge0Result(statusId, statusDescription, stdout, stderr, compileOutput, (int)(time * 1000), memory);
            } else {
                throw new RuntimeException("Judge0 execution service returned error status: " + response.statusCode() + " - " + response.body());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute code on Judge0 compiler sandbox: " + e.getMessage(), e);
        }
    }

    private String decodeBase64(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }
        try {
            return new String(Base64.getDecoder().decode(value.trim()));
        } catch (Exception e) {
            return value;
        }
    }

    public record Judge0Result(
        int statusId,
        String statusDescription,
        String stdout,
        String stderr,
        String compileOutput,
        int runtimeMs,
        int memoryKb
    ) {
        public boolean isAccepted() {
            return statusId == 3;
        }
    }
}
