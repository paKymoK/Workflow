package com.takypok.workflowservice.function.validator;

import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
@Slf4j
public class Example2Validator implements ValidatorInterface {
  @Override
  public Mono<Boolean> validate(Ticket<TicketDetail> ticket) {
    System.out.println("Ex2 validate triggered !");
    return Mono.just(true);
  }

  @Override
  public String validateFailedMessage() {
    return null;
  }
}
