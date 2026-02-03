package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.IdEntity;
import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Status extends IdEntity {
  private String name;
  private String color;
  private GroupStatus group;
}
