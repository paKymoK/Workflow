package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.request.StatusCreateRequest;
import com.takypok.workflowservice.model.request.StatusUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface StatusService {
  Mono<List<Status>> get();

  Mono<Status> getById(Long id);

  Mono<Status> create(StatusCreateRequest request);

  Mono<Status> update(StatusUpdateRequest request);

  Mono<Void> delete(Long id);
}
