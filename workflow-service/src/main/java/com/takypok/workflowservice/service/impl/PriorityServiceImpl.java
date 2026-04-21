package com.takypok.workflowservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.model.entity.Priority;
import com.takypok.workflowservice.model.request.PriorityCreateRequest;
import com.takypok.workflowservice.model.request.PriorityUpdateRequest;
import com.takypok.workflowservice.repository.PriorityRepository;
import com.takypok.workflowservice.service.PriorityService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class PriorityServiceImpl implements PriorityService {
  private final PriorityRepository priorityRepository;

  @Override
  public Mono<List<Priority>> get() {
    return priorityRepository.findAll().collectList();
  }

  @Override
  public Mono<Priority> getById(Long id) {
    return priorityRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Priority not existed")));
  }

  @Override
  public Mono<Priority> create(PriorityCreateRequest request) {
    Priority priority = new Priority();
    priority.setName(request.getName());
    priority.setResponseTime(request.getResponseTime());
    priority.setResolutionTime(request.getResolutionTime());
    return priorityRepository.save(priority);
  }

  @Override
  public Mono<Priority> update(PriorityUpdateRequest request) {
    return getById(request.getId())
        .flatMap(
            priority -> {
              priority.setName(request.getName());
              priority.setResponseTime(request.getResponseTime());
              priority.setResolutionTime(request.getResolutionTime());
              return priorityRepository.save(priority);
            });
  }

  @Override
  public Mono<Void> delete(Long id) {
    return getById(id).flatMap(priorityRepository::delete);
  }
}
