package com.takypok.workflowservice.model.entity;

import java.time.ZonedDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SlaStatus {
  private String responseStatus;
  private ZonedDateTime responseTime;
  private String resolutionStatus;
  private ZonedDateTime resolutionTime;
}
