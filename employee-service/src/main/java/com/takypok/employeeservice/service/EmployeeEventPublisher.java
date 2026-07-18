package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.event.EmployeeEvent;
import com.takypok.employeeservice.model.event.EmployeeEventType;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Publishing is best-effort: a Kafka outage must not take down the CRUD API, since Phase 1 has no
 * consumers relying on delivery yet. Failures are logged, not propagated.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmployeeEventPublisher {
  private final KafkaTemplate<String, EmployeeEvent> kafkaTemplate;

  @Value("${employee-events.topic}")
  private String topic;

  public Mono<Void> publish(EmployeeEventType eventType, EmployeeResponse snapshot) {
    EmployeeEvent event = new EmployeeEvent(eventType, snapshot);
    return Mono.fromFuture(kafkaTemplate.send(topic, event.getSub(), event))
        .doOnError(
            ex ->
                log.error(
                    "Failed to publish {} event for employee {}", eventType, event.getSub(), ex))
        .onErrorResume(ex -> Mono.empty())
        .then();
  }
}
