package com.takypok.workflowservice.model.mapper;

import com.takypok.workflowservice.model.entity.Status;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.request.CreateWorkflowTransitionRequest;
import java.util.List;
import java.util.Objects;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class TransitionMapper {
  @Mapping(target = "from", expression = "java(getStatus(request.getFrom(),statuses))")
  @Mapping(target = "to", expression = "java(getStatus(request.getTo(),statuses))")
  public abstract Transition mapToTransition(
      CreateWorkflowTransitionRequest request, List<Status> statuses);

  protected Status getStatus(Long statusId, List<Status> statuses) {
    for (Status status : statuses) {
      if (Objects.equals(status.getId(), statusId)) {
        return status;
      }
    }
    return null;
  }
}
