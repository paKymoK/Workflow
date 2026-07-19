package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.NewsType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FilterNewsRequest {
  private NewsType type;

  @NotNull private Long page = 0L;
  @NotNull private Long size = 20L;
}
