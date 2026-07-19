package com.takypok.employeeservice.config;

import com.takypok.employeeservice.model.entity.Department;
import com.takypok.employeeservice.model.event.DepartmentEvent;
import com.takypok.employeeservice.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Read-only mirror of auth-service's Department table (Phase 7) — auth-service is the authoritative
 * owner and the only writer; this just upserts (or deletes) the local copy so EmployeeServiceImpl's
 * departmentName enrichment join keeps working without a live cross-service call. {@code
 * spring.json.value.default.type} is overridden per-listener here since employee-service's global
 * Kafka consumer default type is AccountEvent (see kafka.yml).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DepartmentEventConsumer {
  private final DepartmentRepository departmentRepository;
  private final R2dbcEntityTemplate r2dbcEntityTemplate;

  @KafkaListener(
      topics = "${department-events.topic:department.events}",
      groupId = "${spring.application.name}",
      properties =
          "spring.json.value.default.type=com.takypok.employeeservice.model.event.DepartmentEvent")
  public void onDepartmentEvent(DepartmentEvent event) {
    if (event == null || event.getId() == null) {
      log.warn("Ignoring malformed department event: {}", event);
      return;
    }
    if ("DELETED".equals(event.getEventType())) {
      departmentRepository
          .deleteById(event.getId())
          .doOnError(
              ex -> log.error("Failed to delete department mirror row {}", event.getId(), ex))
          .onErrorResume(ex -> Mono.empty())
          .subscribe();
      return;
    }
    departmentRepository
        .existsById(event.getId())
        .flatMap(
            exists -> {
              Department department = new Department();
              department.setId(event.getId());
              department.setName(event.getName());
              // `id` is set from the auth-service-assigned value, so repository.save() would
              // misread a genuinely new row as an update (same pattern as AccountEventConsumer).
              return exists
                  ? departmentRepository.save(department)
                  : r2dbcEntityTemplate.insert(Department.class).using(department);
            })
        .doOnError(
            ex -> log.error("Failed to process department event for id {}", event.getId(), ex))
        .onErrorResume(ex -> Mono.empty())
        .subscribe();
  }
}
