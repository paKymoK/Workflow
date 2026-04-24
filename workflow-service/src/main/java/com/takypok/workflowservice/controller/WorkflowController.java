package com.takypok.workflowservice.controller;

import static com.takypok.core.util.AuthenticationUtil.getUserInfo;

import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.request.WorkflowCreateRequest;
import com.takypok.workflowservice.model.request.WorkflowUpdateRequest;
import com.takypok.workflowservice.service.WorkflowService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
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
  public Mono<ResultMessage<Workflow>> getById(
      @PathVariable Long id, Authentication authentication) {
    User user = getUserInfo(authentication);
    System.out.println(user);
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
