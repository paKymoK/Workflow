package com.takypok.workflowservice.function.postfunction;

import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
@Slf4j
public class Example2Function implements PostFunctionInterface {

  @Override
  public Mono<Void> run(Ticket<TicketDetail> ticket) {
    return Mono.defer(
        () -> {
          System.out.println("Ex2 func triggered !");
          return Mono.empty();
        });
  }
}
