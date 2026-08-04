package com.takypok.employeeservice.model.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Local copy of auth-service's event contract published to {@code unit.events} (Phase 7). See
 * {@link com.takypok.employeeservice.config.UnitEventConsumer}.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UnitEvent {
  private String eventType; // CREATED, UPDATED, DELETED
  private Long id;
  private String name;
  private Long departmentId;
  private String head;
  private String location;
}
