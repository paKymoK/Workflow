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
import org.springframework.http.codec.ServerSentEvent;
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
  public Mono<ResultMessage<TicketSla>> getById(@PathVariable Long id) {
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

  @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<ServerSentEvent<ResultMessage<PageResponse<TicketSla>>>> streamTicketSla(
      @Valid FilterTicketRequest request, @RequestParam(defaultValue = "5") int intervalSeconds) {
    return Flux.interval(Duration.ZERO, Duration.ofSeconds(intervalSeconds))
        .flatMap(
            sequence ->
                ticketService
                    .get(request)
                    .map(ResultMessage::success)
                    .map(
                        messages ->
                            ServerSentEvent.<ResultMessage<PageResponse<TicketSla>>>builder()
                                .id(String.valueOf(sequence))
                                .event("sla-update")
                                .data(messages)
                                .build()));
  }

  @GetMapping(value = "/stream/id", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<ServerSentEvent<ResultMessage<TicketSla>>> streamTicketSlaById(
      @Valid @RequestParam Long id, @RequestParam(defaultValue = "5") int intervalSeconds) {
    return Flux.interval(Duration.ZERO, Duration.ofSeconds(intervalSeconds))
        .flatMap(
            sequence ->
                ticketService
                    .get(id)
                    .map(ResultMessage::success)
                    .map(
                        messages ->
                            ServerSentEvent.<ResultMessage<TicketSla>>builder()
                                .id(String.valueOf(sequence))
                                .event("sla-update")
                                .data(messages)
                                .build()));
  }
}
