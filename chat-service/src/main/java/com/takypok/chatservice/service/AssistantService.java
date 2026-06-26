package com.takypok.chatservice.service;

import com.takypok.chatservice.model.AnswerResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
public class AssistantService {

  private final ChatClient chatClient;
  private final VectorStore vectorStore;

  private String stripThinkingTokens(String response) {
    if (response == null) return "";
    return response.replaceAll("(?s)<think>.*?</think>", "").trim();
  }

  public Mono<AnswerResponse> ask(String question) {
    return Mono.fromCallable(
            () -> {
              List<Document> docs =
                  vectorStore.similaritySearch(
                      SearchRequest.builder().query(question).topK(4).build());

              List<String> sources =
                  docs.stream()
                      .map(d -> (String) d.getMetadata().getOrDefault("source", "unknown"))
                      .distinct()
                      .toList();

              var prompt = chatClient.prompt().user(question);

              String raw =
                  docs.isEmpty()
                      ? prompt.call().content()
                      : prompt
                          .advisors(
                              new QuestionAnswerAdvisor(
                                  vectorStore,
                                  SearchRequest.builder().query(question).topK(4).build()))
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
