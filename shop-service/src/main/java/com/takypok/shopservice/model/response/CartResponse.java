package com.takypok.shopservice.model.response;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;

@Builder
public record CartResponse(
    Long id, List<CartItemResponse> items, Long totalItems, BigDecimal totalPrice) {}
