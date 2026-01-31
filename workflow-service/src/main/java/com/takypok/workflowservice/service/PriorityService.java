package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Priority;
import java.util.List;
import reactor.core.publisher.Mono;

public interface PriorityService {
  Mono<List<Priority>> get();

  Mono<Priority> getById(Long id);
}
