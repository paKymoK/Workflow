package com.takypok.workflowservice.function.validator;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class RequirePendingReasonValidator implements ValidatorInterface {

  @Override
  public Mono<Boolean> validate(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {
    return Mono.just(request.getPendingReason() != null);
  }

  @Override
  public String validateFailedMessage() {
    return "A pending reason is required to put this ticket on hold.";
  }
}
