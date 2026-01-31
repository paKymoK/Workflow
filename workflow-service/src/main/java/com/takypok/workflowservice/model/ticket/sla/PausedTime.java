package com.takypok.workflowservice.model.ticket.sla;

import com.takypok.core.model.BaseEntity;
import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PausedTime extends BaseEntity {
  private ZonedDateTime pausedTime;
  private ZonedDateTime resumeTime;

  public PausedTime(ZonedDateTime pausedTime) {
    this.pausedTime = pausedTime;
    this.resumeTime = null;
  }
}
