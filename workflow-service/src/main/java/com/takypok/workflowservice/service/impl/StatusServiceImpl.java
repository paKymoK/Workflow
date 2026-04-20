package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.model.entity.Status;
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
    return statusRepository.findById(id);
  }
}
