package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Priority;
import com.takypok.workflowservice.model.request.PriorityCreateRequest;
import com.takypok.workflowservice.model.request.PriorityUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface PriorityService {
  Mono<List<Priority>> get();

  Mono<Priority> getById(Long id);

  Mono<Priority> create(PriorityCreateRequest request);

  Mono<Priority> update(PriorityUpdateRequest request);

  Mono<Void> delete(Long id);
}
