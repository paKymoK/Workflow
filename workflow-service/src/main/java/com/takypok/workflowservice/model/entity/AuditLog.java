package com.takypok.workflowservice.model.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.takypok.core.model.authentication.User;
import java.time.ZonedDateTime;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Table("audit_log")
public class AuditLog {
  @Id private Long id;
  private Long ticketId;
  private String action;
  private User actor;
  private JsonNode payload;
  private ZonedDateTime createdAt;
}
