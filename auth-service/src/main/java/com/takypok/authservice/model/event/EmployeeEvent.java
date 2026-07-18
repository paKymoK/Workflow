package com.takypok.authservice.model.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Local, deliberately partial copy of employee-service's event contract published to {@code
 * employee.events} — only the fields auth-service's mirror actually needs. Each consumer is
 * expected to own its own view of the event rather than share a DTO across services.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeEvent {
  private String eventType;
  private String sub;
  private Payload payload;

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Payload {
    private String name;
    private String email;
    private String avatarUrl;
    private String title;
    private String departmentName;
  }
}
