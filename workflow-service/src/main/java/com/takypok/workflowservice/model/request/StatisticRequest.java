package com.takypok.workflowservice.model.request;

import java.time.ZonedDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class StatisticRequest {
  private ZonedDateTime from;
  private ZonedDateTime to;
}
