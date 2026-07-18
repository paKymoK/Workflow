package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.Shift;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateEmployeeRequest {
  @NotBlank private String name;
  private String email;
  private String avatarUrl;
  private String title;
  private Long departmentId;
  private Long unitId;
  private String workLocation;
  private LocalDate joinedDate;
  private Shift shift;
  private String shiftHours;
}
