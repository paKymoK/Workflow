package com.takypok.chatservice.service;

import com.takypok.chatservice.model.AnswerResponse;
import com.takypok.chatservice.model.assistant.AssistantTurn;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.rag.enabled", havingValue = "true", matchIfMissing = false)
public class AssistantService {

  private final ChatClient chatClient;
  private final VectorStore vectorStore;
  private final FilterExpressionBuilder filterBuilder = new FilterExpressionBuilder();

  private String stripThinkingTokens(String response) {
    if (response == null) return "";
    return response.replaceAll("(?s)<think>.*?</think>", "").trim();
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
                  .build();
            })
        .subscribeOn(Schedulers.boundedElastic());
  }
}
