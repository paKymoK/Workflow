package com.takypok.shopservice.model.response;

import lombok.Builder;

@Builder
public record PaymentCreateResponse(String orderId, String paymentUrl) {}
