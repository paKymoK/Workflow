package com.takypok.workflowservice.model.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.time.ZonedDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class TicketSla extends Ticket<TicketDetail> {
  @JsonIgnore(false)
  private ZonedDateTime createdAt;

  private Sla sla;
}
