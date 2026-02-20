package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.IssueType;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface IssueTypeRepository extends R2dbcRepository<IssueType, Long> {
  Flux<IssueType> findAllByProjectId(Long projectId);
}
