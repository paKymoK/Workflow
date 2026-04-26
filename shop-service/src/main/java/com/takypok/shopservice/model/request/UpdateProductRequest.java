package com.takypok.shopservice.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class UpdateProductRequest {
  @NotNull private Long id;

  @NotBlank private String name;

  @NotBlank private String category;

  private String imageUrl;

  @NotNull private Object detail;

  @NotNull private Long stock;

  @NotNull private BigDecimal price;

  @NotBlank private String currency;
}
