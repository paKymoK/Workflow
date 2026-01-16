package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/workflow")
public class WorkflowController {
  private final WorkflowService workflowService;

  @GetMapping("/{id}")
  public Mono<ResultMessage<?>> getWorkflow(@PathVariable Long id) {
    return workflowService.get(id).map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<Workflow>> createWorkflow() {
    return workflowService.create().map(ResultMessage::success);
  }
}
