package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.BaseEntity;
import com.takypok.workflowservice.model.enums.PendingReason;
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
  private PendingReason reason;
  private String description;

  public PausedTime(ZonedDateTime pausedTime) {
    this.pausedTime = pausedTime;
    this.resumeTime = null;
  }

  public PausedTime(ZonedDateTime pausedTime, PendingReason reason, String description) {
    this.pausedTime = pausedTime;
    this.resumeTime = null;
    this.reason = reason;
    this.description = description;
  }
}
