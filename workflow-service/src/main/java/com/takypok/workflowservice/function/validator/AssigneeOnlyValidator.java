package com.takypok.workflowservice.function.validator;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class AssigneeOnlyValidator implements ValidatorInterface {

  @Override
  public Mono<Boolean> validate(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {
    if (ticket.getAssignee() == null) {
      return Mono.just(false);
    }
    return Mono.just(Objects.equals(ticket.getAssignee().getSub(), currentUser.getSub()));
  }

  @Override
  public String validateFailedMessage() {
    return "Only the assignee can perform this transition !";
  }
}
