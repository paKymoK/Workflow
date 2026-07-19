package com.takypok.employeeservice.model.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PinNewsPostRequest {
  @NotNull private Boolean pinned;
}
