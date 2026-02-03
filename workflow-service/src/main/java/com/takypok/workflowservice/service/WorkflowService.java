package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.request.CreateWorkflowRequest;
import reactor.core.publisher.Mono;

public interface WorkflowService {
  Mono<Workflow> get(Long id);

  Mono<Workflow> create(CreateWorkflowRequest request);
}
