package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import reactor.core.publisher.Mono;

public interface TicketService<T extends TicketDetail> {
  Mono<Ticket<T>> get(Long id);

  Mono<Ticket<T>> create(Ticket<T> ticket);

  Mono<Ticket<TicketDetail>> transition(TransitionRequest transitionRequest);
}
