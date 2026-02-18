package com.takypok.workflowservice.model.entity;

import java.time.ZonedDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class SlaEvent {
  private String name;
  private ZonedDateTime time;
}
