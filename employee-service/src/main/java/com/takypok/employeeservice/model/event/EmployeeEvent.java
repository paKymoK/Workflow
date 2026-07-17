package com.takypok.employeeservice.model.event;

import com.takypok.employeeservice.model.response.EmployeeResponse;
import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Full-snapshot event published to {@code employee.events} on every create/update. Consumers upsert
 * their local copy from {@code payload} rather than diffing — simpler than reconciling partial
 * deltas, at the cost of a slightly larger message.
 */
@Getter
@Setter
public class EmployeeEvent {
  private UUID eventId = UUID.randomUUID();
  private EmployeeEventType eventType;
  private ZonedDateTime occurredAt = ZonedDateTime.now();
  private Long employeeId;
  private String sub;
  private String employeeCode;
  private EmployeeResponse payload;

  public EmployeeEvent() {}

  public EmployeeEvent(EmployeeEventType eventType, EmployeeResponse payload) {
    this.eventType = eventType;
    this.payload = payload;
    this.employeeId = payload.getId();
    this.sub = payload.getSub();
    this.employeeCode = payload.getEmployeeCode();
  }
}
