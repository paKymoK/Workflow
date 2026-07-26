package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.DocumentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * status is an optional filter with no implicit default — callers decide what "no filter" means.
 */
@Getter
@Setter
public class FilterDocumentRequest {
  private String category;
  private DocumentStatus status;

  @NotNull private Long page = 0L;
  @NotNull private Long size = 20L;
}
