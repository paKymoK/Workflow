package com.takypok.workflowservice.model.ticket.internal;

import com.takypok.workflowservice.model.annotation.InternalApplicationAnnotation;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
@NoArgsConstructor
@ToString
@InternalApplicationAnnotation(value = "Dashboard", assignee = "admin")
public class Dashboard extends InternalApplication implements TicketDetail {}
