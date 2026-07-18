package com.takypok.workflowservice.model.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;

/**
 * Read-only local read-model of employee-service's General record — see {@link
 * com.takypok.workflowservice.config.EmployeeDirectoryEventConsumer}. Backs @mention search and
 * assignee resolution without a live call to employee-service per request.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDirectory {
  @Id private String sub;
  private String name;
  private String email;
  private String title;
  private String department;
  private String avatarUrl;
  private String managerSub;
}
