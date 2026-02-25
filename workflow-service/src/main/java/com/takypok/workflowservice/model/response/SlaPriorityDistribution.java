package com.takypok.workflowservice.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SlaPriorityDistribution {
  private String priorityName;
  private Long responseOverdue;
  private Long resolutionOverdue;
  private Long onTime;
  private Long pending;
  private Long total;
}
