package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Project;
import com.takypok.workflowservice.model.request.ProjectCreateRequest;
import com.takypok.workflowservice.model.request.ProjectUpdateRequest;
import com.takypok.workflowservice.service.ProjectService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/project")
public class ProjectController {
  private final ProjectService projectService;

  @GetMapping("")
  public Mono<ResultMessage<List<Project>>> get() {
    return projectService.get().map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Project>> getById(@PathVariable Long id) {
    return projectService.getById(id).map(ResultMessage::success);
  }

  @GetMapping("/{id}/issue")
  public Mono<ResultMessage<List<IssueType>>> getIssueTypeByProjectId(@PathVariable Long id) {
    return projectService.getIssueTypeByProjectId(id).map(ResultMessage::success);
  }

  @PostMapping("")
  public Mono<ResultMessage<Project>> create(@Valid @RequestBody ProjectCreateRequest request) {
    return projectService.create(request).map(ResultMessage::success);
  }

  @PutMapping("")
  public Mono<ResultMessage<Project>> update(@Valid @RequestBody ProjectUpdateRequest request) {
    return projectService.update(request).map(ResultMessage::success);
  }

  @DeleteMapping("/{id}")
  public Mono<ResultMessage<Void>> delete(@PathVariable Long id) {
    return projectService.delete(id).then(Mono.just(ResultMessage.success(null)));
  }
}
