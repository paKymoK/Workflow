package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.AuditLog;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface AuditLogRepository extends R2dbcRepository<AuditLog, Long> {
  Flux<AuditLog> findByTicketIdOrderByIdDesc(Long ticketId);

  Flux<AuditLog> findTop20ByOrderByIdDesc();
}
