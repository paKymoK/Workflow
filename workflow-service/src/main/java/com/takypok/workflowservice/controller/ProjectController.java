package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Project;
import com.takypok.workflowservice.service.ProjectService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
}
