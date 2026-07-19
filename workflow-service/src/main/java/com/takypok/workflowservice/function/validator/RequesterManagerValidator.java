package com.takypok.workflowservice.function.validator;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.service.EmployeeDirectoryService;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Gates a transition on the caller being the requester's manager, resolved live from {@code
 * employee_directory.manager_sub} — not a fixed list, since the eligible person changes with the
 * org chart. No argument needed; "the requester's manager" is always relative to the ticket being
 * transitioned.
 *
 * <p>Fails closed (blocks, doesn't auto-pass) when the requester has no manager on record — e.g. an
 * incomplete employee-service profile, or the top of the org chart — since silently opening the
 * transition to anyone whenever org data is incomplete is the riskier default.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RequesterManagerValidator implements ValidatorInterface {

  private final EmployeeDirectoryService employeeDirectoryService;

  @Override
  public Mono<Boolean> validate(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {
    if (ticket.getReporter() == null
        || ticket.getReporter().getSub() == null
        || currentUser == null) {
      return Mono.just(false);
    }
    return employeeDirectoryService
        .getManagerSub(ticket.getReporter().getSub())
        .map(managerSub -> Objects.equals(managerSub, currentUser.getSub()))
        .defaultIfEmpty(false);
  }

  @Override
  public String validateFailedMessage() {
    return "Only the requester's manager can perform this transition !";
  }
}
