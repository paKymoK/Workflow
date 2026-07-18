package com.takypok.authservice.model.event;

import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Announces that a sub has just become real — either a guest account was created, or an internal
 * LDAP user logged in for the first time. employee-service consumes this to create a PENDING shell
 * employee record; it never accepts a directly-typed sub on create anymore.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountEvent {
  private String sub;
  private ZonedDateTime occurredAt;

  public AccountEvent(String sub) {
    this.sub = sub;
    this.occurredAt = ZonedDateTime.now();
  }
}
