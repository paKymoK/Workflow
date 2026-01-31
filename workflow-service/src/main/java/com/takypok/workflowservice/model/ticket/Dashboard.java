package com.takypok.workflowservice.model.ticket;

import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.ticket.annotation.IssueTypeAnnotation;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@IssueTypeAnnotation(value = "Dashboard")
public class Dashboard implements TicketDetail {
  private String data;
}
