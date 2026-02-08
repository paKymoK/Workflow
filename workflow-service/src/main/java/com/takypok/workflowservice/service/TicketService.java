package com.takypok.workflowservice.service;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.CreateTicketRequest;
import com.takypok.workflowservice.model.request.FilterTicketRequest;
import com.takypok.workflowservice.model.request.TransitionRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface TicketService {
  Mono<List<Ticket<TicketDetail>>> get(FilterTicketRequest request);

  Mono<List<Sla>> getSla();

  Mono<Ticket<TicketDetail>> get(Long id);

  Mono<Ticket<TicketDetail>> create(CreateTicketRequest request, User user);

  Mono<Sla> pause(Long id, User user);

  Mono<Sla> resume(Long id, User user);

  Mono<Ticket<TicketDetail>> transition(TransitionRequest transitionRequest);
}
