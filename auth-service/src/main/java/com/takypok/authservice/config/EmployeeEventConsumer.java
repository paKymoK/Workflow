package com.takypok.authservice.config;

import com.takypok.authservice.model.entity.EmployeeMirror;
import com.takypok.authservice.model.event.EmployeeEvent;
import com.takypok.authservice.repository.EmployeeMirrorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Upsert-only consumer feeding {@link EmployeeMirror} — no write path back to employee-service,
 * this is purely a local read cache for {@link CustomOAuth2TokenCustomizer}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmployeeEventConsumer {
  private final EmployeeMirrorRepository employeeMirrorRepository;

  @KafkaListener(
      topics = "${employee-events.topic:employee.events}",
      groupId = "${spring.application.name}")
  public void onEmployeeEvent(EmployeeEvent event) {
    if (event == null || event.getSub() == null || event.getPayload() == null) {
      log.warn("Ignoring malformed employee event: {}", event);
      return;
    }
    EmployeeEvent.Payload payload = event.getPayload();
    employeeMirrorRepository.save(
        new EmployeeMirror(
            event.getSub(),
            payload.getName(),
            payload.getEmail(),
            payload.getTitle(),
            payload.getDepartmentName(),
            payload.getAvatarUrl()));
  }
}
