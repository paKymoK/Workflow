package com.takypok.workflowservice.function.postfunction.index;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import reactor.core.publisher.Mono;

public interface PostFunctionInterface {
  Mono<Ticket<TicketDetail>> run(Ticket<TicketDetail> ticket, User currentUser);
}
