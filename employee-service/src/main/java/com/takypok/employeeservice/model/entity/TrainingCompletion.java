package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per employee per training material they've completed — idempotent, unique pair. Inherited
 * createdAt (from IdEntity/BaseEntity) is the completion timestamp.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCompletion extends IdEntity {
  private Long trainingMaterialId;
  private String employeeSub;
}
