package com.takypok.chatservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.chatservice.model.event.ChatEvent;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;

/**
 * Tracks live WebSocket connections per authenticated user (sub) and fans out {@link ChatEvent}s to
 * them. In-memory only — intentional for a single chat-service instance; horizontal scaling would
 * require replacing this with a Redis pub/sub-backed implementation.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatSessionRegistry {
  private final ObjectMapper objectMapper;
  private final Map<String, Set<Sinks.Many<String>>> sinksBySub = new ConcurrentHashMap<>();

  public void register(String sub, Sinks.Many<String> sink) {
    sinksBySub.computeIfAbsent(sub, key -> new CopyOnWriteArraySet<>()).add(sink);
  }

  public void unregister(String sub, Sinks.Many<String> sink) {
    sinksBySub.computeIfPresent(
        sub,
        (key, sinks) -> {
          sinks.remove(sink);
          return sinks.isEmpty() ? null : sinks;
        });
  }

  public void sendToUser(String sub, ChatEvent event) {
    Set<Sinks.Many<String>> sinks = sinksBySub.get(sub);
    if (sinks == null || sinks.isEmpty()) {
      return;
    }
    String payload = serialize(event);
    if (payload == null) {
      return;
    }
    sinks.forEach(sink -> sink.tryEmitNext(payload));
  }

  public void broadcast(Collection<String> subs, ChatEvent event) {
    subs.forEach(sub -> sendToUser(sub, event));
  }

  private String serialize(ChatEvent event) {
    try {
      return objectMapper.writeValueAsString(event);
    } catch (Exception e) {
      log.error("Unable to serialize chat event: {}", e.getMessage(), e);
      return null;
    }
  }
}
