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
  private Long time;
  private SlaStatus status;
  private Priority priority;
  private ListPausedTime pausedTime;
  private SlaSetting setting;
}
