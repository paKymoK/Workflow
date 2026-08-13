package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Workflow;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface WorkflowRepository extends R2dbcRepository<Workflow, Long> {
  Mono<Boolean> existsByName(String name);

  Mono<Boolean> existsByNameAndIdNot(String name, Long id);
}
