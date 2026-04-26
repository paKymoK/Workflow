package com.takypok.shopservice.model.response;

import lombok.Builder;

@Builder
public record CheckoutResponse(
    Long cartId, String orderId, Long totalAmount, String currency, Long totalItems) {}
