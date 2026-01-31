package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.IdEntity;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Ticket<T extends TicketDetail> extends IdEntity {
  private Project project;
  private IssueType issueType;
  private Priority priority;
  private String status;
  private String summary;
  private User reporter;
  private User assignee;
  private T detail;
  private Workflow workflow;
}
