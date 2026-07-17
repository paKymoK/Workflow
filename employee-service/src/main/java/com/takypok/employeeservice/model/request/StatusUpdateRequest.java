package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.EmploymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusUpdateRequest {
  @NotNull private EmploymentStatus status;
}
