package com.takypok.employeeservice.model.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Local copy of auth-service's event contract published to {@code department.events} (Phase 7). See
 * {@link com.takypok.employeeservice.config.DepartmentEventConsumer}.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DepartmentEvent {
  private String eventType; // CREATED, UPDATED, DELETED
  private Long id;
  private String name;
  private String head;
  private String location;
}
