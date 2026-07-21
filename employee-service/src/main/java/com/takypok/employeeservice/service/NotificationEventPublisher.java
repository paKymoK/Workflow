package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.event.NotificationEvent;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Best-effort publish, same philosophy as {@link EmployeeEventPublisher}. */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisher {
  private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

  @Value("${notification-events.topic}")
  private String topic;

  public Mono<Void> publish(
      String title, String body, List<String> recipientSubs, Map<String, String> data) {
    if (recipientSubs == null || recipientSubs.isEmpty()) {
      return Mono.empty();
    }
    NotificationEvent event = new NotificationEvent(title, body, recipientSubs, data);
    return Mono.fromFuture(kafkaTemplate.send(topic, event.getEventId().toString(), event))
        .doOnError(ex -> log.error("Failed to publish notification event {}", title, ex))
        .onErrorResume(ex -> Mono.empty())
        .then();
  }
}
