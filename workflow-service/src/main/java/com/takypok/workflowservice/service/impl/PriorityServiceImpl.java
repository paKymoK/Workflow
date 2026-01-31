package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.model.entity.Priority;
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
    return priorityRepository.findById(id);
  }
}
