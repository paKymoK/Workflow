package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Department extends IdEntity {
  @NotBlank private String name;
}
