package com.takypok.chatservice.service;

import com.takypok.chatservice.model.AnswerResponse;
import com.takypok.chatservice.model.ImageRef;
import com.takypok.chatservice.model.assistant.AssistantTurn;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.document.Document;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.rag.enabled", havingValue = "true", matchIfMissing = false)
public class AssistantService {

  // Matches IngestionService's bucket name for files sitting directly under documents/.
  private static final String UNCATEGORIZED = "uncategorized";

  private final ChatClient chatClient;
  private final VectorStore vectorStore;
  private final FilterExpressionBuilder filterBuilder = new FilterExpressionBuilder();

  private static final Pattern MARKDOWN_IMAGE_PATTERN =
      Pattern.compile("!\\[([^\\]]*)\\]\\(([^)\\s]+)\\)");

  private String stripThinkingTokens(String response) {
    if (response == null) return "";
    return response.replaceAll("(?s)<think>.*?</think>", "").trim();
  }

  /**
   * Pulls markdown image references (`![alt](url)`) out of the retrieved sources, deduped by URL.
   * Reads each source file's full, unsplit text from disk rather than the retrieved chunk text:
   * TokenTextSplitter's chunk boundaries don't respect markdown syntax, and can even drop a
   * character during its token encode/decode round-trip right at the split point — so a chunk
   * fragment alone can't be trusted to contain an intact `![alt](url)` reference.
   */
  private List<ImageRef> extractImages(List<String> sources, String application) {
    Map<String, ImageRef> images = new LinkedHashMap<>();
    for (String source : sources) {
      String content = readSourceFile(application, source);
      if (content == null) continue;
      Matcher matcher = MARKDOWN_IMAGE_PATTERN.matcher(content);
      while (matcher.find()) {
        String url = matcher.group(2);
        images.putIfAbsent(url, new ImageRef(url, matcher.group(1)));
      }
    }
    return List.copyOf(images.values());
  }

  private String readSourceFile(String application, String fileName) {
    try {
      File root = new ClassPathResource("documents").getFile();
      File searchRoot = UNCATEGORIZED.equals(application) ? root : new File(root, application);
      if (!searchRoot.isDirectory()) return null;

      try (Stream<Path> paths = Files.walk(searchRoot.toPath())) {
        Optional<Path> match =
            paths
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().equals(fileName))
                .findFirst();
        if (match.isEmpty()) return null;
        return Files.readString(match.get());
      }
    } catch (IOException e) {
      log.warn(
          "Could not read source file {}/{} for image extraction: {}",
          application,
          fileName,
          e.getMessage());
      return null;
    }
  }

  private List<Message> toSpringAiMessages(List<AssistantTurn> history) {
    return history.stream()
        .map(
            turn ->
                turn.getRole() == AssistantTurn.Role.USER
                    ? (Message) new UserMessage(turn.getContent())
                    : new AssistantMessage(turn.getContent()))
        .toList();
  }

  public Mono<AnswerResponse> ask(
      String question, List<AssistantTurn> history, String application) {
    return Mono.fromCallable(
            () -> {
              var filterExpression = filterBuilder.eq("application", application).build();

              List<Document> docs =
                  vectorStore.similaritySearch(
                      SearchRequest.builder()
                          .query(question)
                          .topK(4)
                          .filterExpression(filterExpression)
                          .build());

              List<String> sources =
                  docs.stream()
                      .map(d -> (String) d.getMetadata().getOrDefault("source", "unknown"))
                      .distinct()
                      .toList();

              List<ImageRef> images = extractImages(sources, application);

              var prompt =
                  chatClient
                      .prompt()
                      .options(OllamaChatOptions.builder().disableThinking().build())
                      .messages(toSpringAiMessages(history))
                      .user(question);

              String raw =
                  docs.isEmpty()
                      ? prompt.call().content()
                      : prompt
                          .advisors(
                              QuestionAnswerAdvisor.builder(vectorStore)
                                  .searchRequest(
                                      SearchRequest.builder()
                                          .query(question)
                                          .topK(4)
                                          .filterExpression(filterExpression)
                                          .build())
                                  .build())
                          .call()
                          .content();

              return AnswerResponse.builder()
                  .answer(stripThinkingTokens(raw))
                  .sources(sources)
                  .images(images)
                  .build();
            })
        .subscribeOn(Schedulers.boundedElastic());
  }
}
