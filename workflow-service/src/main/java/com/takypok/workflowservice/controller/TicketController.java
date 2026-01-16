package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.InternalApplication;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/ticket")
public class TicketController {
  private final TicketService<TicketDetail> ticketService;

  @GetMapping("/{id}")
  public Mono<ResultMessage<?>> getById(@PathVariable Long id) {
    return ticketService.get(id).map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<?>> createTicket() {
    Ticket<TicketDetail> iaTicket = new Ticket<>();
    iaTicket.setDetail(new InternalApplication("test"));
    return ticketService.create(iaTicket).map(ResultMessage::success);
  }

  @PostMapping("/transition")
  public Mono<ResultMessage<?>> transition(@RequestBody TransitionRequest transitionRequest) {
    return ticketService.transition(transitionRequest).map(ResultMessage::success);
  }
}
