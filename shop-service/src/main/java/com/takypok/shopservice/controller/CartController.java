package com.takypok.shopservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.shopservice.model.request.UpsertCartItemRequest;
import com.takypok.shopservice.model.response.CartResponse;
import com.takypok.shopservice.model.response.CheckoutResponse;
import com.takypok.shopservice.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/cart")
public class CartController {
  private final CartService cartService;

  @GetMapping("")
  public Mono<ResultMessage<CartResponse>> get() {
    return cartService.getActiveCart().map(ResultMessage::success);
  }

  @PutMapping("/items")
  public Mono<ResultMessage<CartResponse>> upsertItem(
      @Valid @RequestBody UpsertCartItemRequest request) {
    return cartService.upsertItem(request).map(ResultMessage::success);
  }

  @DeleteMapping("/items/{productId}")
  public Mono<ResultMessage<CartResponse>> removeItem(@PathVariable Long productId) {
    return cartService.removeItem(productId).map(ResultMessage::success);
  }

  @PostMapping("/checkout")
  public Mono<ResultMessage<CheckoutResponse>> checkout() {
    return cartService.checkout().map(ResultMessage::success);
  }
}
