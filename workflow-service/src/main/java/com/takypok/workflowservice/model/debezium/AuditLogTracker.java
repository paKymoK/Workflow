package com.takypok.workflowservice.model.debezium;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class AuditLogTracker {
  private Long id;
  private Long ticket_id;
  private String action;
  private String actor; // jsonb arrives as a JSON string in CDC
}
