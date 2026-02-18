package com.takypok.workflowservice.model.entity;

import com.takypok.workflowservice.model.enums.StatusSla;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SlaStatus {
  private StatusSla response;
  private Boolean isResponseOverdue;
  private StatusSla resolution;
  private Boolean isResolutionOverdue;
}
