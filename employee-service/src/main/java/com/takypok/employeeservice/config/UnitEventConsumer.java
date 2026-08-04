package com.takypok.employeeservice.config;

import com.takypok.employeeservice.model.entity.Unit;
import com.takypok.employeeservice.model.event.UnitEvent;
import com.takypok.employeeservice.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Read-only mirror of auth-service's Unit table (Phase 7) — auth-service is the authoritative owner
 * and the only writer; this just upserts (or deletes) the local copy so EmployeeServiceImpl's
 * unitName enrichment join keeps working without a live cross-service call. {@code
 * spring.json.value.default.type} is overridden per-listener here since employee-service's global
 * Kafka consumer default type is AccountEvent (see kafka.yml).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UnitEventConsumer {
  private final UnitRepository unitRepository;
  private final R2dbcEntityTemplate r2dbcEntityTemplate;

  @KafkaListener(
      topics = "${unit-events.topic:unit.events}",
      groupId = "${spring.application.name}",
      properties =
          "spring.json.value.default.type=com.takypok.employeeservice.model.event.UnitEvent")
  public void onUnitEvent(UnitEvent event) {
    if (event == null || event.getId() == null) {
      log.warn("Ignoring malformed unit event: {}", event);
      return;
    }
    if ("DELETED".equals(event.getEventType())) {
      unitRepository
          .deleteById(event.getId())
          .doOnError(ex -> log.error("Failed to delete unit mirror row {}", event.getId(), ex))
          .onErrorResume(ex -> Mono.empty())
          .subscribe();
      return;
    }
    unitRepository
        .existsById(event.getId())
        .flatMap(
            exists -> {
              Unit unit = new Unit();
              unit.setId(event.getId());
              unit.setName(event.getName());
              unit.setDepartmentId(event.getDepartmentId());
              unit.setHead(event.getHead());
              unit.setLocation(event.getLocation());
              // `id` is set from the auth-service-assigned value, so repository.save() would
              // misread a genuinely new row as an update (same pattern as AccountEventConsumer).
              return exists
                  ? unitRepository.save(unit)
                  : r2dbcEntityTemplate.insert(Unit.class).using(unit);
            })
        .doOnError(ex -> log.error("Failed to process unit event for id {}", event.getId(), ex))
        .onErrorResume(ex -> Mono.empty())
        .subscribe();
  }
}
