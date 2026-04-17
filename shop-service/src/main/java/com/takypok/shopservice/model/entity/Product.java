package com.takypok.shopservice.model.entity;

import com.takypok.core.model.IdEntity;
import java.math.BigDecimal;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product<T extends ProductInformation> extends IdEntity {
  private String name;
  private String type;
  private String imageUrl;
  private T detail;
  private Long stock;
  private BigDecimal price;
  private String currency;
}
