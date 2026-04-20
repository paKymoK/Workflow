package com.takypok.shopservice.model.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class FilterProductRequest {
  @Min(0)
  private Long page = 0L;

  @Min(1)
  @Max(100)
  private Long size = 10L;

  @Pattern(regexp = "id|price|name")
  private String sortBy = "id";

  @Pattern(regexp = "asc|desc")
  private String sortDir = "desc";
}
