package com.takypok.shopservice.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpsertCartItemRequest {
  @NotNull private Long productId;

  @NotNull
  @Min(1)
  private Long quantity;
}
