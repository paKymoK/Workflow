package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.IdEntity;
import com.takypok.workflowservice.model.entity.custom.ListTransition;
import com.takypok.workflowservice.model.entity.custom.ListWorkflowNode;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Workflow extends IdEntity {
  private String name;
  private ListWorkflowNode statuses;
  private ListTransition transitions;
}
