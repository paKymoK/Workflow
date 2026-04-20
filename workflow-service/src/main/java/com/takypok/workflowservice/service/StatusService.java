package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Status;
import java.util.List;
import reactor.core.publisher.Mono;

public interface StatusService {
  Mono<List<Status>> get();

  Mono<Status> getById(Long id);
}
