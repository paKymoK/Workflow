package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.Shift;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateEmployeeRequest {
  @NotBlank private String sub;
  @NotBlank private String employeeCode;
  @NotBlank private String name;
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
}
