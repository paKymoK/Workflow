package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.authentication.User;
import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRecord {
  private String transitionName;
  private User approvedBy;
  private ZonedDateTime approvedAt;
}
