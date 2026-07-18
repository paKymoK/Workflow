package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.EmploymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FilterEmployeeRequest {
  private String q;
  private Long departmentId;
  private Long unitId;
  private EmploymentStatus status;
  private String managerSub;

  @NotNull private Long page = 0L;
  @NotNull private Long size = 20L;
}
