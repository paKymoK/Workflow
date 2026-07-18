package com.takypok.employeeservice.model.request;

import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeePersonalRequest {
  private String personalEmail;
  private String mobilePhone;
  private LocalDate dateOfBirth;
  private String gender;
  private String nationalId;
  private String address;
  private String emergencyContactName;
  private String emergencyContactPhone;
}
