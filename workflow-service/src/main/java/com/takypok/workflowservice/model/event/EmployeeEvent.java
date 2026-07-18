package com.takypok.workflowservice.model.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Local, deliberately partial copy of employee-service's event contract published to {@code
 * employee.events} — only the fields workflow-service's directory read-model actually needs. Each
 * consumer owns its own view of the event rather than sharing a DTO across services.
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
    private String managerSub;
  }
}
