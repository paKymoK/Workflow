package com.takypok.employeeservice.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToggleReactionRequest {
  @NotBlank
  @Pattern(regexp = "like|love|celebrate|insightful")
  private String emoji;
}
