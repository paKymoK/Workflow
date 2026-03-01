package com.takypok.workflowservice.service.impl;

import static com.takypok.core.util.ClazzUtil.isImplementationClazz;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.IdEntity;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.entity.WorkflowNode;
import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import com.takypok.workflowservice.model.entity.custom.ListTransition;
import com.takypok.workflowservice.model.entity.custom.ListWorkflowNode;
import com.takypok.workflowservice.model.mapper.TransitionMapper;
import com.takypok.workflowservice.model.mapper.WorkflowMapper;
import com.takypok.workflowservice.model.request.WorkflowCreateRequest;
import com.takypok.workflowservice.model.request.WorkflowTransitionRequest;
import com.takypok.workflowservice.model.request.WorkflowUpdateRequest;
import com.takypok.workflowservice.repository.StatusRepository;
import com.takypok.workflowservice.repository.WorkflowRepository;
import com.takypok.workflowservice.service.WorkflowService;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
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
  private final TransitionMapper transitionMapper;
  private final WorkflowMapper workflowMapper;

  @Override
  public Mono<List<Workflow>> get() {
    return workflowRepository.findAll().collectList();
  }

  @Override
  public Mono<Workflow> getById(Long id) {
    return workflowRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Workflow không tồn tại !")));
  }

  @Override
  public Mono<Workflow> create(WorkflowCreateRequest request) {
    return statusRepository
        .findAllById(request.getStatuses())
        .collectList()
        .flatMap(
            statuses ->
                workflowRepository.save(
                    workflowMapper.mapToEntity(
                        request.getName(),
                        new ListWorkflowNode(validatedStatus(request, statuses)),
                        new ListTransition(
                            validatedTransition(request.getTransitions(), statuses)))));
  }

  @Override
  public Mono<Workflow> update(WorkflowUpdateRequest request) {
    return workflowRepository.save(
        workflowMapper.mapToEntity(
            request.getId(),
            request.getName(),
            new ListWorkflowNode(request.getStatuses()),
            new ListTransition(
                validatedTransition(request.getTransitions(), request.getStatuses()))));
  }

  private String findStatusNotExist(List<Long> request, List<Long> database) {
    Set<Long> diff = new HashSet<>(request);
    diff.removeAll(new HashSet<>(database));
    return "Status Id " + diff + " is not exist !";
  }

  private List<Transition> validatedTransition(
      List<WorkflowTransitionRequest> transitions, List<? extends Status> statuses) {
    AtomicLong todoNodeCount = new AtomicLong(0L);
    statuses.forEach(
        status -> {
          if (GroupStatus.TODO.equals(status.getGroup())) {
            todoNodeCount.getAndIncrement();
            if (todoNodeCount.get() > 1) {
              throw new ApplicationException(
                  Message.Application.ERROR, "Workflow can't have more than one TODO node");
            }
          }
        });

    if (todoNodeCount.get() < 1) {
      throw new ApplicationException(
          Message.Application.ERROR, "Workflow must have one TODO node !");
    }

    boolean hasDuplicate = transitions.stream().distinct().count() < transitions.size();

    if (hasDuplicate) {
      throw new ApplicationException(
          Message.Application.ERROR, "Workflow transition has duplicate !");
    }

    return transitions.stream()
        .map(
            transitionRequest -> {
              validateValidator(transitionRequest);
              validatePostFunction(transitionRequest);
              return transitionMapper.mapToTransition(transitionRequest, new ArrayList<>(statuses));
            })
        .toList();
  }

  private List<WorkflowNode> validatedStatus(
      WorkflowCreateRequest request, List<? extends Status> statuses) {
    if (statuses.size() == request.getStatuses().size()) {
      return statuses.stream().map(WorkflowNode::new).toList();
    } else {
      throw new ApplicationException(
          Message.Application.ERROR,
          findStatusNotExist(
              request.getStatuses(),
              statuses.stream().map(IdEntity::getId).collect(Collectors.toList())));
    }
  }

  private void validateValidator(WorkflowTransitionRequest transitionRequest) {
    transitionRequest
        .getValidator()
        .forEach(
            validate -> {
              try {
                if (!isImplementationClazz(
                    Class.forName(validate), ValidatorInterface.class.getName())) {
                  throw new ApplicationException(
                      Message.Application.ERROR, "Validator " + validate + " not valid !");
                }
              } catch (ClassNotFoundException e) {
                throw new ApplicationException(
                    Message.Application.ERROR, "Validator " + validate + " not found !");
              }
            });
  }

  private void validatePostFunction(WorkflowTransitionRequest transitionRequest) {
    transitionRequest
        .getPostFunctions()
        .forEach(
            postFunction -> {
              try {
                if (!isImplementationClazz(
                    Class.forName(postFunction), PostFunctionInterface.class.getName())) {
                  throw new ApplicationException(
                      Message.Application.ERROR, "Post Function " + postFunction + " not valid !");
                }
              } catch (ClassNotFoundException e) {
                throw new ApplicationException(
                    Message.Application.ERROR, "Post Function " + postFunction + " not found !");
              }
            });
  }
}
