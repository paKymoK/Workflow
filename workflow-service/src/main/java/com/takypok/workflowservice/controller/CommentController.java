package com.takypok.workflowservice.controller;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Comment;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.request.CommentRequest;
import com.takypok.workflowservice.model.request.CommentUpdateRequest;
import com.takypok.workflowservice.security.Actor;
import com.takypok.workflowservice.security.TicketAccessPolicy;
import com.takypok.workflowservice.service.CommentService;
import com.takypok.workflowservice.service.EmployeeDirectoryService;
import com.takypok.workflowservice.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/ticket/{ticketId}/comment")
public class CommentController {
  private final CommentService commentService;
  private final TicketService ticketService;
  private final TicketAccessPolicy ticketAccessPolicy;
  private final EmployeeDirectoryService employeeDirectoryService;

  @GetMapping("")
  public Mono<ResultMessage<List<Comment>>> get(
      @PathVariable Long ticketId, Authentication authentication) {
    Actor actor = Actor.from(authentication);
    return withTicketAccess(ticketId, actor, ticket -> commentService.get(ticketId))
        .map(ResultMessage::success);
  }

  @PostMapping("")
  public Mono<ResultMessage<Comment>> comment(
      @PathVariable Long ticketId,
      @RequestBody @Valid CommentRequest request,
      Authentication authentication) {
    Actor actor = Actor.from(authentication);
    return withTicketAccess(
            ticketId,
            actor,
            ticket ->
                employeeDirectoryService
                    .resolveActingUser(actor)
                    .flatMap(user -> commentService.comment(ticketId, request, user)))
        .map(ResultMessage::success);
  }

  @PutMapping("/{commentId}")
  public Mono<ResultMessage<Comment>> update(
      @PathVariable Long ticketId,
      @PathVariable UUID commentId,
      @RequestBody @Valid CommentUpdateRequest request,
      Authentication authentication) {
    Actor actor = Actor.from(authentication);
    return withTicketAccess(
            ticketId,
            actor,
            ticket ->
                employeeDirectoryService
                    .resolveActingUser(actor)
                    .flatMap(
                        user ->
                            commentService.update(ticketId, commentId, request.getContent(), user)))
        .map(ResultMessage::success);
  }

  private <T> Mono<T> withTicketAccess(
      Long ticketId, Actor actor, Function<Ticket<?>, Mono<T>> action) {
    return ticketService
        .get(ticketId)
        .flatMap(
            ticket ->
                ticketAccessPolicy
                    .canView(actor, ticket)
                    .flatMap(
                        allowed ->
                            allowed
                                ? action.apply(ticket)
                                : Mono.<T>error(
                                    new ApplicationException(
                                        Message.Application.ERROR,
                                        "You are not allowed to access this ticket"))));
  }
}
