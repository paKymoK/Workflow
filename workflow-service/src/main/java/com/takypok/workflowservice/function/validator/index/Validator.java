package com.takypok.workflowservice.function.validator.index;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.lang.reflect.InvocationTargetException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class Validator {
  public final Mono<Boolean> validate(String clazzName, Ticket<TicketDetail> ticket) {
    try {
      ValidatorInterface myInstance =
          (ValidatorInterface) Class.forName(clazzName).getDeclaredConstructor().newInstance();
      return myInstance.validate(ticket);
    } catch (ClassNotFoundException
        | NoSuchMethodException
        | InstantiationException
        | IllegalAccessException
        | InvocationTargetException e) {
      return Mono.error(
          new ApplicationException(Message.Application.REASON_ERROR, "Validator not found !"));
    }
  }

  public final String getFailedMessage(String clazzName) {
    try {
      ValidatorInterface myInstance =
          (ValidatorInterface) Class.forName(clazzName).getDeclaredConstructor().newInstance();
      return myInstance.validateFailedMessage();
    } catch (ClassNotFoundException
        | NoSuchMethodException
        | InstantiationException
        | IllegalAccessException
        | InvocationTargetException e) {
      throw new ApplicationException(Message.Application.REASON_ERROR, "Validator not found !");
    }
  }
}
