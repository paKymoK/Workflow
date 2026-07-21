package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.event.DeviceTokenEvent;
import com.takypok.employeeservice.model.event.DeviceTokenEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Publishing is best-effort, same as {@link EmployeeEventPublisher}: a Kafka outage must not fail
 * token registration, since chat-service's mirror is a cache that can be repaired by the next
 * register/unregister call.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeviceTokenEventPublisher {
  private final KafkaTemplate<String, DeviceTokenEvent> kafkaTemplate;

  @Value("${device-token-events.topic}")
  private String topic;

  public Mono<Void> publish(
      DeviceTokenEventType eventType, String sub, String platform, String fcmToken) {
    DeviceTokenEvent event = new DeviceTokenEvent(eventType, sub, platform, fcmToken);
    return Mono.fromFuture(kafkaTemplate.send(topic, sub, event))
        .doOnError(
            ex ->
                log.error("Failed to publish {} device token event for sub {}", eventType, sub, ex))
        .onErrorResume(ex -> Mono.empty())
        .then();
  }
}
