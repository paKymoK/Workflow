package com.takypok.workflowservice.config;

import com.takypok.workflowservice.model.entity.EmployeeDirectory;
import com.takypok.workflowservice.model.event.EmployeeEvent;
import com.takypok.workflowservice.repository.EmployeeDirectoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Upsert-only consumer feeding {@link EmployeeDirectory} — no write path to employee-service. */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmployeeDirectoryEventConsumer {
  private final EmployeeDirectoryRepository employeeDirectoryRepository;
  private final R2dbcEntityTemplate r2dbcEntityTemplate;

  @KafkaListener(
      topics = "${employee-events.topic:employee.events}",
      groupId = "${spring.application.name}")
  public void onEmployeeEvent(EmployeeEvent event) {
    if (event == null || event.getSub() == null || event.getPayload() == null) {
      log.warn("Ignoring malformed employee event: {}", event);
      return;
    }
    EmployeeEvent.Payload payload = event.getPayload();
    EmployeeDirectory directory =
        new EmployeeDirectory(
            event.getSub(),
            payload.getName(),
            payload.getEmail(),
            payload.getTitle(),
            payload.getDepartmentName(),
            payload.getAvatarUrl(),
            payload.getManagerSub());
    upsert(directory).block();
  }

  /**
   * `sub` is a manually-assigned, never-null key, so Spring Data R2DBC's default isNew()-by-null
   * check can't tell a fresh row from an existing one — same pitfall as employee-service's own
   * `sub`-keyed entities. Insert explicitly on first sight, update via repository.save() after.
   */
  private Mono<EmployeeDirectory> upsert(EmployeeDirectory directory) {
    return employeeDirectoryRepository
        .existsById(directory.getSub())
        .flatMap(
            exists ->
                exists
                    ? employeeDirectoryRepository.save(directory)
                    : r2dbcEntityTemplate.insert(EmployeeDirectory.class).using(directory));
  }
}
