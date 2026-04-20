package com.takypok.shopservice.model.product;

import com.takypok.shopservice.model.entity.ProductInformation;
import java.math.BigDecimal;
import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ProductInfo implements ProductInformation {
  private String sku;
  private List<String> tags;
  private BigDecimal rating;
  private String description;
}
