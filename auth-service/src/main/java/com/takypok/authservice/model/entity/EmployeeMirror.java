package com.takypok.authservice.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Read-only mirror of employee-service's General record, fed by consuming the employee.events Kafka
 * topic — see {@link com.takypok.authservice.config.EmployeeEventConsumer}. Shape deliberately
 * matches {@link Userinfo} so the JWT "info" claim built from it is unchanged.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeMirror {
  @JsonIgnore @Id private String sub;

  private String name;
  private String email;
  private String title;
  private String department;
  private String avatar;
}
