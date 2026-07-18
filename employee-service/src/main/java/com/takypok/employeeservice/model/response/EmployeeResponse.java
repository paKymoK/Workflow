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
  private String sub;
  private String name;
  private String email;
  private String avatarUrl;
  private String title;
  private Long departmentId;
  private String departmentName;
  private Long unitId;
  private String unitName;
  private String workLocation;
  private String managerSub;
  private LocalDate joinedDate;
  private Shift shift;
  private String shiftHours;
  private EmploymentStatus status;
  private ZonedDateTime createdAt;
  private ZonedDateTime modifiedAt;
}
