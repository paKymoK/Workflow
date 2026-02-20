package com.takypok.workflowservice.model.entity;

import com.takypok.core.model.IdEntity;
import com.takypok.workflowservice.model.entity.custom.ListPausedTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Sla extends IdEntity {
  private Long ticketId;
  private SlaStatus status;
  private Boolean isPaused;
  private ListPausedTime pausedTime;
  private Priority priority;
  private SlaSetting setting;
}
