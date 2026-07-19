package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.NewsType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNewsPostRequest {
  @NotNull private NewsType type;
  @NotBlank private String title;
  @NotBlank private String body;
  private String imageUrl;
  private Boolean isAnonymous = false;
}
