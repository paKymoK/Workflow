package com.takypok.workflowservice.client;

import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthServiceClient {

  private final WebClient webClient;

  public AuthServiceClient(@Qualifier("lbWebClientBuilder") WebClient.Builder webClientBuilder) {
    this.webClient = webClientBuilder.build();
  }

  public Mono<User> getUser(String sub) {
    return webClient
        .get()
        .uri("lb://auth-service/v1/users/{sub}", sub)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<ResultMessage<User>>() {})
        .mapNotNull(ResultMessage::getData)
        .onErrorResume(
            e -> {
              log.warn("Failed to fetch user '{}' from auth-service: {}", sub, e.getMessage());
              return Mono.empty();
            });
  }
}
