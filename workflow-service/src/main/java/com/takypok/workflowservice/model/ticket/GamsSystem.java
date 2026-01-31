package com.takypok.workflowservice.model.ticket;

import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.ticket.annotation.IssueTypeAnnotation;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@IssueTypeAnnotation(value = "GAMS System")
public class GamsSystem implements TicketDetail {
  private String test;
}
