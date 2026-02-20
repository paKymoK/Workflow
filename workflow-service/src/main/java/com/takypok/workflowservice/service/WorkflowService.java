package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.request.CreateWorkflowRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface WorkflowService {
  Mono<List<Workflow>> get(Long id);

  Mono<Workflow> getById(Long id);

  Mono<Workflow> create(CreateWorkflowRequest request);
}
