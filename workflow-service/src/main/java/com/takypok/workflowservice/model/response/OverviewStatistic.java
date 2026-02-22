package com.takypok.workflowservice.model.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import com.takypok.workflowservice.utils.GroupStatusSerializer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OverviewStatistic {
  @JsonSerialize(using = GroupStatusSerializer.class)
  private GroupStatus name;

  private Long value;
}
