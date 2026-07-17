package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Employee extends IdEntity {
  private String sub;
  private String employeeCode;
  private String name;
  private String email;
  private String mobilePhone;
  private String avatarUrl;
  private String title;
  private String department;
  private String line;
  private String workLocation;
  private Long managerId;
  private LocalDate joinedDate;
  private Shift shift;
  private String shiftHours;
  private EmploymentStatus status = EmploymentStatus.ACTIVE;
}
