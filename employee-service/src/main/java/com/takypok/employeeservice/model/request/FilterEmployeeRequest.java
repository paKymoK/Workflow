package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.EmploymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FilterEmployeeRequest {
  private String q;
  private String department;
  private String line;
  private EmploymentStatus status;
  private Long managerId;

  @NotNull private Long page = 0L;
  @NotNull private Long size = 20L;
}
