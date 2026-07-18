package com.takypok.employeeservice.model.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Local, deliberately partial copy of auth-service's event contract published to {@code
 * account.events} — announces that a sub just became real (guest account created, or first
 * successful LDAP login). See {@link com.takypok.employeeservice.config.AccountEventConsumer}.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AccountEvent {
  private String sub;
}
