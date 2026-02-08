package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface TicketRepository<T extends TicketDetail> extends R2dbcRepository<Ticket<T>, Long> {

  Flux<Ticket<T>> findAllBy(Pageable pageable);
}
