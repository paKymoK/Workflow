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
public class EmployeePersonal extends BaseEntity {
  @Id private String sub;
  private String personalEmail;
  private String mobilePhone;
  private LocalDate dateOfBirth;
  private String gender;
  private String nationalId;
  private String address;
  private String emergencyContactName;
  private String emergencyContactPhone;
}
