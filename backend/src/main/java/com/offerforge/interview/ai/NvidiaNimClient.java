package com.offerforge.interview.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class NvidiaNimClient {

    private final String apiKey;
    private final String provider; // "nvidia" or "ollama"
    private final String endpoint;
    private final String defaultModel;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public NvidiaNimClient(
            @Value("${nvidia.nim.api-key:}") String apiKey,
            @Value("${llm.provider:ollama}") String provider,
            @Value("${ollama.api-url:http://host.docker.internal:11434}") String ollamaApiUrl,
            @Value("${ollama.model:deepseek-r1:8b}") String ollamaModel
    ) {
        this.apiKey = apiKey;
        this.provider = provider.toLowerCase();
        
        if ("ollama".equals(this.provider)) {
            this.endpoint = ollamaApiUrl + "/v1/chat/completions";
            this.defaultModel = ollamaModel;
        } else {
            this.endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
            this.defaultModel = "";
        }
        
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public String generate(String systemPrompt, String userMessage, String modelName) {
        String targetModel = "ollama".equals(this.provider) ? this.defaultModel : modelName;

        if ("nvidia".equals(this.provider) && (apiKey == null || apiKey.trim().isEmpty())) {
            throw new IllegalStateException("NVIDIA NIM API key is not configured. Please set the NVIDIA_NIM_API_KEY environment variable in your .env file.");
        }

        try {
            // Build the chat completion request payload (OpenAI & Ollama OpenAI compatible formats)
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", targetModel);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1500);

            ArrayNode messages = requestBody.putArray("messages");

            ObjectNode systemMessageNode = objectMapper.createObjectNode();
            systemMessageNode.put("role", "system");
            systemMessageNode.put("content", systemPrompt);
            messages.add(systemMessageNode);

            ObjectNode userMessageNode = objectMapper.createObjectNode();
            userMessageNode.put("role", "user");
            userMessageNode.put("content", userMessage);
            messages.add(userMessageNode);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(45)); // reasoning models can take slightly longer

            if ("nvidia".equals(this.provider)) {
                requestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("choices").get(0).path("message").path("content").asText();
            } else {
                throw new RuntimeException("LLM API returned error status: " + response.statusCode() + " - " + response.body());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call LLM Engine (" + this.provider + "): " + e.getMessage(), e);
        }
    }
}
