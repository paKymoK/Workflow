package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.service.StatusService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
}
