package com.takypok.workflowservice.function.postfunction.index;

import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import reactor.core.publisher.Mono;

public interface PostFunctionInterface {
  Mono<Void> run(Ticket<TicketDetail> ticket);
}
