package com.takypok.workflowservice.model.entity;

import com.takypok.workflowservice.model.enums.StatusSla;
import java.time.ZonedDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SlaStatus {
  private StatusSla response;
  private ZonedDateTime responseTime;
  private StatusSla resolution;
  private ZonedDateTime resolutionTime;
}
