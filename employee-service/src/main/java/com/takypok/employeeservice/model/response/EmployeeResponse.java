package com.takypok.employeeservice.model.response;

import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.entity.Shift;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
  private Long id;
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
  private EmploymentStatus status;
  private ZonedDateTime createdAt;
  private ZonedDateTime modifiedAt;
}
