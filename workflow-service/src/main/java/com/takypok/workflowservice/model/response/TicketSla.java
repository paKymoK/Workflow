package com.takypok.workflowservice.model.response;

import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class TicketSla extends Ticket<TicketDetail> {
    private Sla sla;
}
