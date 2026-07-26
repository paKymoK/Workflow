package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per employee per document they've acknowledged reading — idempotent, unique pair.
 * Inherited createdAt (from IdEntity/BaseEntity) is the acknowledgment timestamp.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAcknowledgment extends IdEntity {
  private Long documentId;
  private String employeeSub;
}
