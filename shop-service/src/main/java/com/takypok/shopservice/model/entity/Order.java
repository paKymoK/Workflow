package com.takypok.shopservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table("shop_order")
public class Order extends IdEntity {
  public static final String STATUS_PENDING_PAYMENT = "PENDING_PAYMENT";
  public static final String STATUS_PAID = "PAID";
  public static final String STATUS_CANCELLED = "CANCELLED";

  private String orderId;
  private Long cartId;
  private String userId;
  private Long totalAmount;
  private String currency;
  private String status;
}
