package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsComment extends IdEntity {
  private Long postId;
  // Never anonymous — comments always identify the real commenter. Display data is resolved live
  // via EmployeeRepository at read time rather than frozen as a snapshot (unlike workflow-service's
  // Comment.commenter, which Phases 3-5 of the Employee Center plan had to go back and fix for
  // exactly this staleness reason) — employee-service already is the live source of truth.
  private String commenterSub;
  private String content;
  private Boolean isEdited = false;
  private ContentStatus status = ContentStatus.PUBLISHED;
}
