package com.takypok.shopservice.mapper;

import com.takypok.shopservice.model.entity.CartItem;
import com.takypok.shopservice.model.response.CartItemResponse;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CartMapper {

  @Mapping(source = "productName", target = "name")
  @Mapping(
      target = "lineTotal",
      expression =
          "java(item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))")
  CartItemResponse toResponse(CartItem item);

  List<CartItemResponse> toResponseList(List<CartItem> items);
}
