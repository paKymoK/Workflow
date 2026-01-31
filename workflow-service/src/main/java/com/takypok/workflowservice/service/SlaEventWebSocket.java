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
import reactor.core.publisher.Sinks;

@Component
@RequiredArgsConstructor
@Slf4j
public class SlaEventWebSocket implements WebSocketHandler {
  private final Sinks.Many<String> sink;

  @NonNull
  @Override
  public Mono<Void> handle(WebSocketSession session) {
    Flux<WebSocketMessage> message = sink.asFlux().map(session::textMessage);
    return session.send(message);
  }
}
