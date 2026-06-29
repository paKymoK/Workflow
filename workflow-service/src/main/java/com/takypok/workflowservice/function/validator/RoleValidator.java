package com.takypok.workflowservice.function.validator;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.index.ParameterizedValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.security.Actor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Gates a transition on the caller holding a given role on the ticket's project. The role is passed
 * as the descriptor argument, so the same bean serves every role-gated transition — e.g. an
 * approval step uses {@code com.takypok.workflowservice.function.validator.RoleValidator#APPROVER}.
 *
 * <p>The caller's roles come from the reactive security context (the JWT), so no extra plumbing is
 * needed through the validator chain.
 */
@Component
@Slf4j
public class RoleValidator implements ParameterizedValidatorInterface {

  @Override
  public Mono<Boolean> validate(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request,
      String arg) {
    if (arg == null || arg.isBlank()) {
      log.warn(
          "RoleValidator used without a role argument on transition '{}'", transition.getName());
      return Mono.just(false);
    }
    Long projectId = ticket.getProject() != null ? ticket.getProject().getId() : null;
    return ReactiveSecurityContextHolder.getContext()
        .map(SecurityContext::getAuthentication)
        .map(authentication -> Actor.from(authentication).hasProjectRole(projectId, arg))
        .defaultIfEmpty(false);
  }

  @Override
  public String validateFailedMessage(String arg) {
    return "You need the " + arg + " role on this project to perform this transition !";
  }
}
