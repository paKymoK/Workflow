package com.takypok.authservice.model.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class FilterUserRequest {
  @Min(0)
  private Integer page = 0;

  @Min(1)
  @Max(100)
  private Integer size = 10;
}
