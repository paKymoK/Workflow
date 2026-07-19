package com.takypok.authservice.model.event;

import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published to {@code unit.events} on create/update/delete — full snapshot, employee-service
 * upserts (or deletes) its read-only mirror row from {@code payload} alone.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnitEvent {
  private String eventType; // CREATED, UPDATED, DELETED
  private Long id;
  private String name;
  private Long departmentId;
  private ZonedDateTime occurredAt;

  public UnitEvent(String eventType, Long id, String name, Long departmentId) {
    this.eventType = eventType;
    this.id = id;
    this.name = name;
    this.departmentId = departmentId;
    this.occurredAt = ZonedDateTime.now();
  }
}
