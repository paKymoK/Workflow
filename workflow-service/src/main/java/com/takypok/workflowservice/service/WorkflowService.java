package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.request.WorkflowCreateRequest;
import com.takypok.workflowservice.model.request.WorkflowUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface WorkflowService {
  Mono<List<Workflow>> get();

  Mono<Workflow> getById(Long id);

  Mono<Workflow> create(WorkflowCreateRequest request);

  Mono<Workflow> update(WorkflowUpdateRequest request);
}
