package com.takypok.shopservice.service;

import com.takypok.shopservice.model.request.UpsertCartItemRequest;
import com.takypok.shopservice.model.response.CartResponse;
import com.takypok.shopservice.model.response.CheckoutResponse;
import reactor.core.publisher.Mono;

public interface CartService {
  Mono<CartResponse> getActiveCart();

  Mono<CartResponse> upsertItem(UpsertCartItemRequest request);

  Mono<CartResponse> removeItem(Long productId);

  Mono<CheckoutResponse> checkout();
}
