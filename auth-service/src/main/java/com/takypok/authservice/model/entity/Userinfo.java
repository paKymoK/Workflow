package com.takypok.authservice.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Userinfo {
  @JsonIgnore
  @Column(updatable = false, nullable = false)
  @Id
  private String sub;

  @NotBlank private String name;
  @NotBlank private String email;
  private String title;
  private String department;
}
