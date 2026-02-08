package com.takypok.workflowservice.controller;

import static com.takypok.core.util.AuthenticationUtil.getUserInfo;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.CreateTicketRequest;
import com.takypok.workflowservice.model.request.FilterTicketRequest;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.model.response.PageResponse;
import com.takypok.workflowservice.model.response.TicketSla;
import com.takypok.workflowservice.service.TicketService;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/ticket")
public class TicketController {
  private final TicketService ticketService;

  @GetMapping("")
  public Mono<ResultMessage<PageResponse<TicketSla>>> get(@Valid FilterTicketRequest request) {
    return ticketService.get(request).map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Ticket<TicketDetail>>> getById(@PathVariable Long id) {
    return ticketService.get(id).map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<Ticket<TicketDetail>>> create(
      @Valid @RequestBody CreateTicketRequest request, Authentication authentication) {
    return ticketService.create(request, getUserInfo(authentication)).map(ResultMessage::success);
  }

  @PostMapping("/pause/{id}")
  public Mono<ResultMessage<Sla>> pause(
      @Valid @PathVariable Long id, Authentication authentication) {
    return ticketService.pause(id, getUserInfo(authentication)).map(ResultMessage::success);
  }

  @PostMapping("/resume/{id}")
  public Mono<ResultMessage<Sla>> resume(
      @Valid @PathVariable Long id, Authentication authentication) {
    return ticketService.resume(id, getUserInfo(authentication)).map(ResultMessage::success);
  }

  @PostMapping("/transition")
  public Mono<ResultMessage<Ticket<TicketDetail>>> transition(
      @RequestBody @Valid TransitionRequest transitionRequest) {
    return ticketService.transition(transitionRequest).map(ResultMessage::success);
  }

  @GetMapping(path = "/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
  public Flux<Sla> stream(@RequestParam String test) {
    // Generates data objects every second
    return Flux.interval(Duration.ofSeconds(1)).map(i -> new Sla()); // Takes 5 items then completes
  }
}
