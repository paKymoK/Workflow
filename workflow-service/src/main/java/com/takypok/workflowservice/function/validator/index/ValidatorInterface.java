package com.takypok.workflowservice.function.validator.index;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import reactor.core.publisher.Mono;

public interface ValidatorInterface {
  Mono<Boolean> validate(Ticket<TicketDetail> ticket, User currentUser, Transition transition);

  String validateFailedMessage();
}
