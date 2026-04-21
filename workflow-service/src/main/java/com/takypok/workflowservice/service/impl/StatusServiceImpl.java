package com.takypok.workflowservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.request.StatusCreateRequest;
import com.takypok.workflowservice.model.request.StatusUpdateRequest;
import com.takypok.workflowservice.repository.StatusRepository;
import com.takypok.workflowservice.service.StatusService;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatusServiceImpl implements StatusService {
  private final StatusRepository statusRepository;

  @Override
  public Mono<List<Status>> get() {
    return statusRepository.findAll().collectSortedList(Comparator.comparing(Status::getId));
  }

  @Override
  public Mono<Status> getById(Long id) {
    return statusRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Status not existed")));
  }

  @Override
  public Mono<Status> create(StatusCreateRequest request) {
    Status status = new Status();
    status.setName(request.getName());
    status.setColor(request.getColor());
    status.setGroup(request.getGroup());
    return statusRepository.save(status);
  }

  @Override
  public Mono<Status> update(StatusUpdateRequest request) {
    return getById(request.getId())
        .flatMap(
            status -> {
              status.setName(request.getName());
              status.setColor(request.getColor());
              status.setGroup(request.getGroup());
              return statusRepository.save(status);
            });
  }

  @Override
  public Mono<Void> delete(Long id) {
    return getById(id).flatMap(statusRepository::delete);
  }
}
