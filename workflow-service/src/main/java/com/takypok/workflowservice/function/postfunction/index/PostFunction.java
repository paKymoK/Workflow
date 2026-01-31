package com.takypok.workflowservice.function.postfunction.index;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.lang.reflect.InvocationTargetException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class PostFunction {
  public final Mono<Void> apply(String clazzName, Ticket<TicketDetail> ticket) {
    try {
      PostFunctionInterface myInstance =
          (PostFunctionInterface) Class.forName(clazzName).getDeclaredConstructor().newInstance();
      return myInstance.run(ticket);
    } catch (ClassNotFoundException
        | NoSuchMethodException
        | InstantiationException
        | IllegalAccessException
        | InvocationTargetException e) {
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "PostFunction not found !"));
    }
  }
}
