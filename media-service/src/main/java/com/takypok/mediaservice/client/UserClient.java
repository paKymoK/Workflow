package com.takypok.mediaservice.client;

import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.UserSummary;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class UserClient {
  private final WebClient webClient;

  public Mono<List<UserSummary>> searchUsers(String q) {
    return webClient
        .get()
        .uri("/v1/users?q={q}&size=10", q)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<ResultMessage<PageResponse<UserSummary>>>() {})
        .map(r -> r.getData().getContent());
  }
}
