package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.LeaveType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeaveBalanceIncrementRequest {
  @NotNull private LeaveType leaveType;

  @NotNull
  @Min(1)
  private Integer days;
}
