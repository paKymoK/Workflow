package com.takypok.shopservice.model.response;

import lombok.Builder;

@Builder
public record CheckoutResponse(Long cartId, Long totalItems) {}
