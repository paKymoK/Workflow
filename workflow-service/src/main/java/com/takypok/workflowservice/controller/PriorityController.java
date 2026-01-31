package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.service.PriorityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/priority")
public class PriorityController {
  private final PriorityService priorityService;

  @GetMapping("")
  public Mono<ResultMessage<?>> get() {
    return priorityService.get().map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<?>> getById(@PathVariable Long id) {
    return priorityService.getById(id).map(ResultMessage::success);
  }
}
