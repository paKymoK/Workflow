package com.takypok.workflowservice.model.mapper;

import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.request.WorkflowTransitionRequest;
import java.util.List;
import java.util.Objects;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class TransitionMapper {
  @Mapping(target = "from", expression = "java(getStatus(request.getFrom(),statuses))")
  @Mapping(target = "to", expression = "java(getStatus(request.getTo(),statuses))")
  public abstract Transition mapToTransition(
      WorkflowTransitionRequest request, List<Status> statuses);

  protected Status getStatus(Long statusId, List<Status> statuses) {
    return statuses.stream()
        .filter(s -> Objects.equals(s.getId(), statusId))
        .findFirst()
        .orElseThrow(
            () ->
                new IllegalStateException(
                    "Status id " + statusId + " not found in workflow statuses"));
  }
}
