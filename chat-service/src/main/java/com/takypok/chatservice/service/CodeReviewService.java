package com.takypok.chatservice.service;

import com.takypok.chatservice.model.CodeReviewResponse;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.rag.enabled", havingValue = "true", matchIfMissing = false)
public class CodeReviewService {

  // Full-context load of the rule set rather than a vector-store similarity search: with a
  // handful of short anti-pattern docs, everything comfortably fits in num-ctx (8192) alongside a
  // diff, so retrieval would add ingestion/embedding machinery for no accuracy benefit yet.
  // Revisit (real similaritySearch, like AssistantService does against crm_vi) once the rule
  // corpus grows past what fits in context.
  private static final String RULES_DIR = "documents/code-review/anti-patterns";

  private static final String SYSTEM_PROMPT =
      """
      /no_think
      You are a senior Java/Spring Boot code reviewer for a reactive (WebFlux/Project Reactor)
      microservices platform.

      You are given a set of anti-pattern rule documents and a git diff. Review ONLY the lines
      the diff actually adds or changes (lines starting with '+'), using the rule documents as
      your sole source of truth — never invent a rule that isn't listed.

      For each rule that is clearly violated, output a finding with:
      - rule: the rule's id (from its front matter)
      - file: the file path from the diff, if identifiable
      - explanation: one or two sentences tied to the specific diff content, not the rule's
        generic description
      - suggestedFix: a short, concrete fix

      Skip any rule that does not apply — do not list rules the diff doesn't violate. If no
      provided rule is violated, respond with exactly: "No anti-patterns found in the provided
      rule set for this diff." Do not comment on formatting/style (already enforced by Spotless).
      """;

  private final ChatClient chatClient;

  public Mono<CodeReviewResponse> review(String diffText) {
    return Mono.fromCallable(
            () -> {
              List<File> rules = ruleFiles();
              String rulesContext =
                  rules.stream()
                      .map(this::readFileQuietly)
                      .filter(StringUtils::hasText)
                      .collect(Collectors.joining("\n\n---\n\n"));

              String userMessage =
                  "## Anti-pattern rules\n"
                      + rulesContext
                      + "\n\n## Diff under review\n```diff\n"
                      + diffText
                      + "\n```";

              String raw =
                  chatClient
                      .prompt()
                      .system(SYSTEM_PROMPT)
                      .options(OllamaChatOptions.builder().disableThinking().build())
                      .user(userMessage)
                      .call()
                      .content();

              return CodeReviewResponse.builder()
                  .review(stripThinkingTokens(raw))
                  .rulesConsidered(rules.stream().map(File::getName).toList())
                  .build();
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private String stripThinkingTokens(String response) {
    if (response == null) return "";
    return response.replaceAll("(?s)<think>.*?</think>", "").trim();
  }

  private List<File> ruleFiles() {
    try {
      File dir = new ClassPathResource(RULES_DIR).getFile();
      File[] files =
          dir.listFiles((d, name) -> name.endsWith(".md") && !name.equalsIgnoreCase("README.md"));
      if (files == null) return List.of();
      return Arrays.stream(files).sorted(Comparator.comparing(File::getName)).toList();
    } catch (IOException e) {
      log.error("Failed to list code-review rule docs: {}", e.getMessage(), e);
      return List.of();
    }
  }

  private String readFileQuietly(File file) {
    try {
      return Files.readString(file.toPath());
    } catch (IOException e) {
      log.warn("Failed to read rule doc {}: {}", file.getName(), e.getMessage());
      return "";
    }
  }
}
