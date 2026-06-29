package com.takypok.workflowservice.function.validator.index;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import reactor.core.publisher.Mono;

/**
 * A validator that takes an argument supplied in the transition config, e.g. {@code
 * com.takypok...RoleValidator#APPROVER}. One bean can therefore cover many rules (one per role)
 * instead of a class per rule. Plain {@link ValidatorInterface} beans remain unchanged.
 */
public interface ParameterizedValidatorInterface {

  Mono<Boolean> validate(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request,
      String arg);

  String validateFailedMessage(String arg);
}
