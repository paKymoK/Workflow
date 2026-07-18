package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.BaseEntity;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Employee extends BaseEntity {
  @Id private String sub;
  private String name;
  private String email;
  private String avatarUrl;
  private String title;
  private Long departmentId;
  private Long unitId;
  private String workLocation;
  private String managerSub;
  private LocalDate joinedDate;
  private Shift shift;
  private String shiftHours;
  private EmploymentStatus status = EmploymentStatus.ACTIVE;
}
