package com.takypok.workflowservice.model.ticket;

import com.takypok.workflowservice.model.annotation.IssueTypeAnnotation;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
@NoArgsConstructor
@ToString
@IssueTypeAnnotation(value = "Dashboard")
public class Dashboard extends InternalApplication implements TicketDetail {}
