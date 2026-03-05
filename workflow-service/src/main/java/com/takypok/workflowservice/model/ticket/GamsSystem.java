package com.takypok.workflowservice.model.ticket;

import com.takypok.workflowservice.model.annotation.IssueTypeAnnotation;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
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
