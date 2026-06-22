package com.takypok.workflowservice.controller;

import static com.takypok.core.util.AuthenticationUtil.getUserInfo;

import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.AuditLog;
import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.AssigneeUpdateRequest;
import com.takypok.workflowservice.model.request.CreateTicketRequest;
import com.takypok.workflowservice.model.request.FilterTicketRequest;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.model.response.TicketSla;
import com.takypok.workflowservice.repository.AuditLogRepository;
import com.takypok.workflowservice.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/ticket")
public class TicketController {
  private final TicketService ticketService;
  private final AuditLogRepository auditLogRepository;

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

  @PatchMapping("/{id}/assignee")
  public Mono<ResultMessage<Ticket<TicketDetail>>> updateAssignee(
      @PathVariable Long id, @Valid @RequestBody AssigneeUpdateRequest request) {
    return ticketService.updateAssignee(id, request).map(ResultMessage::success);
  }

  @PostMapping("/transition")
  public Mono<ResultMessage<Ticket<TicketDetail>>> transition(
      @RequestBody @Valid TransitionRequest transitionRequest, Authentication authentication) {
    return ticketService
        .transition(transitionRequest, getUserInfo(authentication))
        .map(ResultMessage::success);
  }

  @GetMapping("/audit")
  public Mono<ResultMessage<List<AuditLog>>> getRecentAuditLog() {
    return auditLogRepository.findTop20ByOrderByIdDesc().collectList().map(ResultMessage::success);
  }

  @GetMapping("/{id}/audit")
  public Mono<ResultMessage<List<AuditLog>>> getAuditLog(@PathVariable Long id) {
    return auditLogRepository
        .findByTicketIdOrderByIdDesc(id)
        .collectList()
        .map(ResultMessage::success);
  }
}
