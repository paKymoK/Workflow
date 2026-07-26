package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.TrainingFormat;
import com.takypok.employeeservice.model.entity.TrainingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * format and status are optional filters with no implicit default — callers decide what "no filter"
 * means.
 */
@Getter
@Setter
public class FilterTrainingMaterialRequest {
  private String category;
  private TrainingFormat format;
  private TrainingStatus status;

  @NotNull private Long page = 0L;
  @NotNull private Long size = 20L;
}
