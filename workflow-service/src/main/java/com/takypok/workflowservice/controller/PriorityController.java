package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Priority;
import com.takypok.workflowservice.model.request.PriorityCreateRequest;
import com.takypok.workflowservice.model.request.PriorityUpdateRequest;
import com.takypok.workflowservice.service.PriorityService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/priority")
public class PriorityController {
  private final PriorityService priorityService;

  @GetMapping("")
  public Mono<ResultMessage<List<Priority>>> get() {
    return priorityService.get().map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Priority>> getById(@PathVariable Long id) {
    return priorityService.getById(id).map(ResultMessage::success);
  }

  @PostMapping("")
  public Mono<ResultMessage<Priority>> create(@Valid @RequestBody PriorityCreateRequest request) {
    return priorityService.create(request).map(ResultMessage::success);
  }

  @PutMapping("")
  public Mono<ResultMessage<Priority>> update(@Valid @RequestBody PriorityUpdateRequest request) {
    return priorityService.update(request).map(ResultMessage::success);
  }

  @DeleteMapping("/{id}")
  public Mono<ResultMessage<Void>> delete(@PathVariable Long id) {
    return priorityService.delete(id).then(Mono.just(ResultMessage.success(null)));
  }
}
