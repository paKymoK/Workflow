package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.request.WorkflowCreateRequest;
import com.takypok.workflowservice.model.request.WorkflowUpdateRequest;
import com.takypok.workflowservice.service.WorkflowService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/workflow")
public class WorkflowController {
  private final WorkflowService workflowService;

  @GetMapping("")
  public Mono<ResultMessage<List<Workflow>>> get() {
    return workflowService.get().map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Workflow>> getById(@PathVariable Long id) {
    return workflowService.getById(id).map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<Workflow>> create(@Valid @RequestBody WorkflowCreateRequest request) {
    return workflowService.create(request).map(ResultMessage::success);
  }

  @PutMapping
  public Mono<ResultMessage<Workflow>> update(@Valid @RequestBody WorkflowUpdateRequest request) {
    return workflowService.update(request).map(ResultMessage::success);
  }
}
