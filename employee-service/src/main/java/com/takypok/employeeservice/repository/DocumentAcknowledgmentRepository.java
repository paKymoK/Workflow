package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.DocumentAcknowledgment;
import java.util.Collection;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DocumentAcknowledgmentRepository
    extends R2dbcRepository<DocumentAcknowledgment, Long> {

  Mono<DocumentAcknowledgment> findByDocumentIdAndEmployeeSub(Long documentId, String employeeSub);

  Flux<DocumentAcknowledgment> findByDocumentIdIn(Collection<Long> documentIds);
}
