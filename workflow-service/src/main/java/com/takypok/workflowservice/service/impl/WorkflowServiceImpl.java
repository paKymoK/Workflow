package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.function.postfunction.Example1Function;
import com.takypok.workflowservice.function.postfunction.Example2Function;
import com.takypok.workflowservice.function.validator.Example1Validator;
import com.takypok.workflowservice.function.validator.Example2Validator;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.entity.custom.ListStatus;
import com.takypok.workflowservice.model.entity.custom.ListTransition;
import com.takypok.workflowservice.repository.StatusRepository;
import com.takypok.workflowservice.repository.WorkflowRepository;
import com.takypok.workflowservice.service.WorkflowService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowServiceImpl implements WorkflowService {
  private final WorkflowRepository workflowRepository;
  private final StatusRepository statusRepository;

  @Override
  public Mono<Workflow> get(Long id) {
    return workflowRepository.findById(id);
  }

  @Override
  public Mono<Workflow> create() {
    return statusRepository
        .findAll()
        .collectList()
        .flatMap(
            statuses -> {
              List<Transition> transitions = new ArrayList<>();
              List<String> postFunction = new ArrayList<>();
              postFunction.add(Example1Function.class.getName());
              postFunction.add(Example2Function.class.getName());

              List<String> validator = new ArrayList<>();
              validator.add(Example1Validator.class.getName());
              validator.add(Example2Validator.class.getName());
              transitions.add(
                  new Transition(
                      "Approve", statuses.get(0), statuses.get(1), validator, postFunction));
              return workflowRepository.save(
                  new Workflow("Test", new ListStatus(statuses), new ListTransition(transitions)));
            });
  }
}
