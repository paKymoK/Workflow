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

              String answer =
                  chatClient
                      .prompt()
                      .advisors(
                          new QuestionAnswerAdvisor(
                              vectorStore, SearchRequest.builder().query(question).topK(4).build()))
                      .user(question)
                      .call()
                      .content();

              return AnswerResponse.builder().answer(answer).sources(sources).build();
            })
        .subscribeOn(Schedulers.boundedElastic());
  }
}
