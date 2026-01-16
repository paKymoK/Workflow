package com.takypok.workflowservice.function.postfunction;

import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
@Slf4j
public class Example1Function implements PostFunctionInterface {

  @Override
  public Mono<Void> run(Ticket<TicketDetail> ticket) {
    return Mono.just("test")
        .delayElement(Duration.ofSeconds(3))
        .doOnNext(s -> System.out.println("Ex1 func triggered !"))
        .then();
  }
}
