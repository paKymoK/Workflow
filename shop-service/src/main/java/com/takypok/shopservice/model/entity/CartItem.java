package com.takypok.shopservice.model.entity;

import com.takypok.core.model.IdEntity;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartItem extends IdEntity {
  private Long cartId;
  private Long productId;
  private Long quantity;
  private BigDecimal unitPrice;
  private String currency;
  private String productName;
  private String imageUrl;
}
