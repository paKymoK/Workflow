package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.request.StatusCreateRequest;
import com.takypok.workflowservice.model.request.StatusUpdateRequest;
import com.takypok.workflowservice.service.StatusService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/status")
public class StatusController {
  private final StatusService statusService;

  @GetMapping("")
  public Mono<ResultMessage<List<Status>>> get() {
    return statusService.get().map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Status>> getById(@PathVariable Long id) {
    return statusService.getById(id).map(ResultMessage::success);
  }

  @PostMapping("")
  public Mono<ResultMessage<Status>> create(@Valid @RequestBody StatusCreateRequest request) {
    return statusService.create(request).map(ResultMessage::success);
  }

  @PutMapping("")
  public Mono<ResultMessage<Status>> update(@Valid @RequestBody StatusUpdateRequest request) {
    return statusService.update(request).map(ResultMessage::success);
  }

  @DeleteMapping("/{id}")
  public Mono<ResultMessage<Void>> delete(@PathVariable Long id) {
    return statusService.delete(id).then(Mono.just(ResultMessage.success(null)));
  }
}
