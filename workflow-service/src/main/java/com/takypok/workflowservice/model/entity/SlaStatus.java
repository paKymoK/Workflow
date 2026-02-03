package com.takypok.workflowservice.model.entity;

import java.time.ZonedDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SlaStatus {
  private String response;
  private ZonedDateTime responseTime;
  private String resolution;
  private ZonedDateTime resolutionTime;
}
