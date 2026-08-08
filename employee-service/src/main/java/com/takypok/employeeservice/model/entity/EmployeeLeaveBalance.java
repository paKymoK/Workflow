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
public class EmployeeLeaveBalance extends IdEntity {
  private String sub;
  private LeaveType leaveType;
  private int year;
  private int totalDays;
  private int usedDays;
}
