package com.takypok.workflowservice.security;

import com.takypok.core.model.authentication.Roles;
import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import java.util.Objects;
import org.springframework.stereotype.Component;

/**
 * The single source of truth for "who can do what to a ticket" outside of workflow transitions.
 *
 * <p>RBAC (role on the ticket's project) is the baseline; the {@code isReporter} checks are the
 * ABAC part — the rule depends on the relationship between the caller and the ticket. Transition
 * authority is deliberately NOT here: it lives on the workflow transition's validator list.
 */
@Component
public class TicketAccessPolicy {

  public boolean canView(Actor actor, Ticket<?> ticket) {
    return actor.hasProjectRole(projectId(ticket), Roles.AGENT, Roles.APPROVER)
        || isReporter(actor, ticket);
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
