package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.IdEntity;
import com.takypok.workflowservice.model.entity.custom.ListStatus;
import com.takypok.workflowservice.model.entity.custom.ListTransition;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Workflow extends IdEntity {
  private String name;
  private ListStatus statuses;
  private ListTransition transitions;
}
