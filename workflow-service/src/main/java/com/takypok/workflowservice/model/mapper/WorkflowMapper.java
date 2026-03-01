package com.takypok.workflowservice.model.mapper;

import com.takypok.workflowservice.model.entity.Workflow;
import com.takypok.workflowservice.model.entity.custom.ListTransition;
import com.takypok.workflowservice.model.entity.custom.ListWorkflowNode;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class WorkflowMapper {
  @Mapping(target = "id", expression = "java(null)")
  @Mapping(target = "name", source = "name")
  @Mapping(target = "statuses", source = "statues")
  @Mapping(target = "transitions", source = "transitions")
  public abstract Workflow mapToEntity(
      String name, ListWorkflowNode statues, ListTransition transitions);

  @Mapping(target = "id", source = "id")
  @Mapping(target = "name", source = "name")
  @Mapping(target = "statuses", source = "statues")
  @Mapping(target = "transitions", source = "transitions")
  public abstract Workflow mapToEntity(
      Long id, String name, ListWorkflowNode statues, ListTransition transitions);
}
