package com.takypok.shopservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cart extends IdEntity {
  public static final String STATUS_ACTIVE = "ACTIVE";
  public static final String STATUS_CHECKED_OUT = "CHECKED_OUT";

  private String userId;
  private String status;
}
