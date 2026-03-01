package com.takypok.workflowservice.model.entity;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class WorkflowNode extends Status {
  public WorkflowNode(Status status) {
    super(status.getName(), status.getColor(), status.getGroup());
    this.setId(status.getId());
  }

  private Long x;
  private Long y;
}
