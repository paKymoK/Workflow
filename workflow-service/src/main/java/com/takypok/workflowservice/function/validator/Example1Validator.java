package com.takypok.workflowservice.function.validator;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
@Slf4j
public class Example1Validator implements ValidatorInterface {
  @Override
  public Mono<Boolean> validate(
      Ticket<TicketDetail> ticket, User currentUser, Transition transition) {
    System.out.println("Ex1 validate triggered !");
    return Mono.just(true);
  }

  @Override
  public String validateFailedMessage() {
    return "Failed 1";
  }
}
