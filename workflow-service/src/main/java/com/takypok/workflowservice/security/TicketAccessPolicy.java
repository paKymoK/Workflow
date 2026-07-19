package com.takypok.workflowservice.security;

import com.takypok.core.model.authentication.Roles;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.RequesterManagerValidator;
import com.takypok.workflowservice.function.validator.SpecificApproverValidator;
import com.takypok.workflowservice.function.validator.index.Validator;
import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * The single source of truth for "who can do what to a ticket" outside of workflow transitions.
 *
 * <p>RBAC (role on the ticket's project) is the baseline; the {@code isReporter} checks are the
 * ABAC part — the rule depends on the relationship between the caller and the ticket. Transition
 * authority is deliberately NOT here: it lives on the workflow transition's validator list.
 */
@Component
@RequiredArgsConstructor
public class TicketAccessPolicy {

  private static final List<String> ELIGIBILITY_VALIDATOR_CLASSES =
      List.of(SpecificApproverValidator.class.getName(), RequesterManagerValidator.class.getName());

  private final Validator validator;

  /**
   * Role/reporter access is synchronous (JWT-derived, no I/O). Beyond that, a {@code
   * SpecificApproverValidator}/{@code RequesterManagerValidator}-eligible approver for one of the
   * ticket's current outbound transitions must also be able to view it — otherwise they'd pass the
   * transition validator in theory but could never reach the ticket to attempt it. That check
   * reuses the exact same validator beans the transition pipeline calls, speculatively, rather than
   * duplicating the eligibility logic here.
   */
  public Mono<Boolean> canView(Actor actor, Ticket<?> ticket) {
    if (actor.hasProjectRole(projectId(ticket), Roles.AGENT, Roles.APPROVER)
        || isReporter(actor, ticket)) {
      return Mono.just(true);
    }
    return isEligibleApprover(actor, ticket);
  }

  @SuppressWarnings("unchecked")
  private Mono<Boolean> isEligibleApprover(Actor actor, Ticket<?> ticket) {
    if (ticket.getWorkflow() == null
        || ticket.getWorkflow().getTransitions() == null
        || ticket.getStatus() == null) {
      return Mono.just(false);
    }
    User currentUser = actor.user();
    Ticket<TicketDetail> typedTicket = (Ticket<TicketDetail>) ticket;
    return Flux.fromIterable(ticket.getWorkflow().getTransitions())
        .filter(
            t ->
                t.getFrom() != null
                    && Objects.equals(t.getFrom().getId(), ticket.getStatus().getId())
                    && t.getValidator() != null)
        .flatMap(
            t -> Flux.fromIterable(t.getValidator()).map(descriptor -> Map.entry(descriptor, t)))
        .filter(e -> isEligibilityDescriptor(e.getKey()))
        .flatMap(e -> validator.validate(e.getKey(), typedTicket, currentUser, e.getValue(), null))
        .any(Boolean::booleanValue)
        .defaultIfEmpty(false);
  }

  private static boolean isEligibilityDescriptor(String descriptor) {
    int idx = descriptor.indexOf('#');
    String className = idx >= 0 ? descriptor.substring(0, idx) : descriptor;
    return ELIGIBILITY_VALIDATOR_CLASSES.contains(className);
  }

  public boolean canEdit(Actor actor, Ticket<?> ticket) {
    return actor.hasProjectRole(projectId(ticket), Roles.AGENT)
        || (isReporter(actor, ticket) && isOpen(ticket));
  }

  public boolean canAssign(Actor actor, Ticket<?> ticket) {
    return actor.hasProjectRole(projectId(ticket), Roles.AGENT);
  }

  /** Any authenticated user may raise a ticket; they become its reporter. */
  public boolean canCreate(Actor actor, Long projectId) {
    return actor.sub() != null;
  }

  private boolean isReporter(Actor actor, Ticket<?> ticket) {
    return ticket.getReporter() != null
        && Objects.equals(actor.sub(), ticket.getReporter().getSub());
  }

  private boolean isOpen(Ticket<?> ticket) {
    Status status = ticket.getStatus();
    return status == null || status.getGroup() != GroupStatus.DONE;
  }

  private Long projectId(Ticket<?> ticket) {
    return ticket.getProject() != null ? ticket.getProject().getId() : null;
  }
}
