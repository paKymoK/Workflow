package com.takypok.workflowservice.service;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class SlaEventWebSocket implements WebSocketHandler {

  @NonNull
  @Override
  public Mono<Void> handle(WebSocketSession session) {
    Flux<WebSocketMessage> message =
        session
            .receive()
            .map(
                webSocketMessage -> {
                  System.out.println(webSocketMessage.getPayloadAsText());
                  return session.textMessage("Tada");
                });
    return session.send(message);
  }
}
