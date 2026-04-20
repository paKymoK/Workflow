package com.takypok.shopservice.model.response;

import java.math.BigDecimal;
import lombok.Builder;

@Builder
public record CartItemResponse(
    Long productId,
    String name,
    String imageUrl,
    Long quantity,
    BigDecimal unitPrice,
    String currency,
    BigDecimal lineTotal) {}
