package com.takypok.workflowservice.function.postfunction.index;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostFunction {
  private final ApplicationContext applicationContext;

  public final Mono<Ticket<TicketDetail>> apply(
      String clazzName, Ticket<TicketDetail> ticket, User currentUser, Transition transition) {
    try {
      PostFunctionInterface myInstance =
          (PostFunctionInterface) applicationContext.getBean(Class.forName(clazzName));
      return myInstance.run(ticket, currentUser, transition);
    } catch (ClassNotFoundException e) {
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "PostFunction not found !"));
    } catch (Exception e) {
      return Mono.error(
          new ApplicationException(
              Message.Application.ERROR, "PostFunction not registered as a Spring bean !"));
    }
  }
}
