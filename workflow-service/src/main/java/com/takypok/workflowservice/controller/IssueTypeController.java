package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.service.ProjectService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/issue")
public class IssueTypeController {
  private final ProjectService projectService;

  @GetMapping("")
  public Mono<ResultMessage<List<IssueType>>> getAll() {
    return projectService.getAllIssueTypes().map(ResultMessage::success);
  }
}
