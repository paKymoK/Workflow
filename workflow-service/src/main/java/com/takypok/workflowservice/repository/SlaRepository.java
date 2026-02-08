package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Sla;
import java.util.List;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SlaRepository extends R2dbcRepository<Sla, Long> {
  @Query("SELECT * FROM sla WHERE ticket_id = :ticketId")
  Mono<Sla> findByTicketId(Long ticketId);

  @Query("SELECT * FROM sla WHERE ticket_id IN (:ticketIds)")
  Flux<Sla> findByTicketIdIn(List<Long> ticketIds);
}
