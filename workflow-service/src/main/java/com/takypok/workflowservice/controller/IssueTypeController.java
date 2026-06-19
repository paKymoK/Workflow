package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.request.IssueTypeUpdateRequest;
import com.takypok.workflowservice.service.ProjectService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
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

  @PutMapping("/{id}")
  public Mono<ResultMessage<IssueType>> update(
      @PathVariable Long id, @Valid @RequestBody IssueTypeUpdateRequest request) {
    return projectService.updateIssueType(id, request).map(ResultMessage::success);
  }
}
