package com.takypok.workflowservice.function.validator.index;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class Validator {
  private final ApplicationContext applicationContext;

  public final Mono<Boolean> validate(
      String clazzName,
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {
    try {
      ValidatorInterface myInstance =
          (ValidatorInterface) applicationContext.getBean(Class.forName(clazzName));
      return myInstance.validate(ticket, currentUser, transition, request);
    } catch (ClassNotFoundException e) {
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "Validator not found !"));
    } catch (Exception e) {
      return Mono.error(
          new ApplicationException(
              Message.Application.ERROR, "Validator not registered as a Spring bean !"));
    }
  }

  public final String getFailedMessage(String clazzName) {
    try {
      ValidatorInterface myInstance =
          (ValidatorInterface) applicationContext.getBean(Class.forName(clazzName));
      return myInstance.validateFailedMessage();
    } catch (ClassNotFoundException e) {
      throw new ApplicationException(Message.Application.ERROR, "Validator not found !");
    } catch (Exception e) {
      throw new ApplicationException(
          Message.Application.ERROR, "Validator not registered as a Spring bean !");
    }
  }
}
