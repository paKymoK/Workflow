package com.takypok.shopservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.shopservice.exception.CheckoutBusyException;
import com.takypok.shopservice.exception.InsufficientStockException;
import com.takypok.shopservice.model.entity.Cart;
import com.takypok.shopservice.model.entity.CartItem;
import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import com.takypok.shopservice.model.request.UpsertCartItemRequest;
import com.takypok.shopservice.model.response.CartItemResponse;
import com.takypok.shopservice.model.response.CartResponse;
import com.takypok.shopservice.model.response.CheckoutResponse;
import com.takypok.shopservice.repository.CartItemRepository;
import com.takypok.shopservice.repository.CartRepository;
import com.takypok.shopservice.repository.ProductRepository;
import com.takypok.shopservice.service.CartService;
import io.r2dbc.spi.R2dbcException;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {
  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final ProductRepository<ProductInformation> productRepository;
  private final DatabaseClient databaseClient;

  @Override
  public Mono<CartResponse> getActiveCart() {
    return currentUserId()
        .flatMap(this::getOrCreateActiveCart)
        .flatMap(cart -> buildCartResponse(cart.getId()));
  }

  @Override
  public Mono<CartResponse> upsertItem(UpsertCartItemRequest request) {
    return currentUserId()
        .flatMap(this::getOrCreateActiveCart)
        .flatMap(
            cart ->
                productRepository
                    .findById(request.getProductId())
                    .switchIfEmpty(
                        Mono.error(
                            new ApplicationException(
                                Message.Application.ERROR, "Product does not exist")))
                    .flatMap(
                        product -> upsertCartItem(cart.getId(), product, request.getQuantity()))
                    .then(buildCartResponse(cart.getId())));
  }

  @Override
  public Mono<CartResponse> removeItem(Long productId) {
    return currentUserId()
        .flatMap(this::getOrCreateActiveCart)
        .flatMap(
            cart ->
                cartItemRepository
                    .deleteByCartIdAndProductId(cart.getId(), productId)
                    .then(buildCartResponse(cart.getId())));
  }

  @Override
  @Transactional
  public Mono<CheckoutResponse> checkout() {
    return currentUserId()
        .flatMap(this::getOrCreateActiveCart)
        .flatMap(
            cart ->
                cartItemRepository
                    .findByCartId(cart.getId())
                    .collectList()
                    .flatMap(items -> processCheckout(cart, items)))
        .onErrorMap(this::mapCheckoutError);
  }

  private Mono<Void> upsertCartItem(
      Long cartId, Product<ProductInformation> product, Long quantity) {
    return cartItemRepository
        .findByCartIdAndProductId(cartId, product.getId())
        .flatMap(
            existing -> {
              existing.setQuantity(quantity);
              existing.setUnitPrice(product.getPrice());
              existing.setCurrency(product.getCurrency());
              existing.setProductName(product.getName());
              existing.setImageUrl(product.getImageUrl());
              return cartItemRepository.save(existing);
            })
        .switchIfEmpty(
            Mono.defer(
                () -> {
                  CartItem item = new CartItem();
                  item.setCartId(cartId);
                  item.setProductId(product.getId());
                  item.setQuantity(quantity);
                  item.setUnitPrice(product.getPrice());
                  item.setCurrency(product.getCurrency());
                  item.setProductName(product.getName());
                  item.setImageUrl(product.getImageUrl());
                  return cartItemRepository.save(item);
                }))
        .then();
  }

  private Mono<CheckoutResponse> processCheckout(Cart cart, List<CartItem> items) {
    if (items.isEmpty()) {
      return Mono.error(new ApplicationException(Message.Application.ERROR, "Cart is empty"));
    }

    List<CartItem> sortedItems =
        items.stream().sorted(Comparator.comparing(CartItem::getProductId)).toList();

    return Flux.fromIterable(sortedItems)
        .concatMap(item -> lockProductRow(item.getProductId()))
        .thenMany(Flux.fromIterable(sortedItems))
        .concatMap(this::deductStock)
        .then(
            Mono.defer(
                () -> {
                  cart.setStatus(Cart.STATUS_CHECKED_OUT);
                  return cartRepository.save(cart);
                }))
        .thenReturn(
            CheckoutResponse.builder()
                .cartId(cart.getId())
                .totalItems(items.stream().mapToLong(CartItem::getQuantity).sum())
                .build());
  }

  private Mono<Void> lockProductRow(Long productId) {
    return databaseClient
        .sql("SELECT id FROM product WHERE id = :productId FOR UPDATE NOWAIT")
        .bind("productId", productId)
        .fetch()
        .first()
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Product does not exist")))
        .then();
  }

  private Mono<Void> deductStock(CartItem item) {
    return databaseClient
        .sql("UPDATE product SET stock = stock - :qty WHERE id = :productId")
        .bind("qty", item.getQuantity())
        .bind("productId", item.getProductId())
        .fetch()
        .rowsUpdated()
        .flatMap(
            rows -> {
              if (rows == 0) {
                return Mono.error(
                    new ApplicationException(Message.Application.ERROR, "Product does not exist"));
              }
              return Mono.empty();
            });
  }

  private Mono<CartResponse> buildCartResponse(Long cartId) {
    return cartItemRepository
        .findByCartId(cartId)
        .collectList()
        .map(
            items -> {
              List<CartItemResponse> responseItems =
                  items.stream()
                      .map(
                          item ->
                              CartItemResponse.builder()
                                  .productId(item.getProductId())
                                  .name(item.getProductName())
                                  .imageUrl(item.getImageUrl())
                                  .quantity(item.getQuantity())
                                  .unitPrice(item.getUnitPrice())
                                  .currency(item.getCurrency())
                                  .lineTotal(
                                      item.getUnitPrice()
                                          .multiply(BigDecimal.valueOf(item.getQuantity())))
                                  .build())
                      .toList();

              long totalItems = items.stream().mapToLong(CartItem::getQuantity).sum();
              BigDecimal totalPrice =
                  items.stream()
                      .map(
                          item ->
                              item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                      .reduce(BigDecimal.ZERO, BigDecimal::add);

              return CartResponse.builder()
                  .id(cartId)
                  .items(responseItems)
                  .totalItems(totalItems)
                  .totalPrice(totalPrice)
                  .build();
            });
  }

  private Mono<Cart> getOrCreateActiveCart(String userId) {
    return cartRepository
        .findByUserIdAndStatus(userId, Cart.STATUS_ACTIVE)
        .switchIfEmpty(Mono.defer(() -> cartRepository.save(new Cart(userId, Cart.STATUS_ACTIVE))));
  }

  private Mono<String> currentUserId() {
    return ReactiveSecurityContextHolder.getContext()
        .map(SecurityContext::getAuthentication)
        .filter(Objects::nonNull)
        .map(Principal::getName)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Unauthenticated")));
  }

  private Throwable mapCheckoutError(Throwable throwable) {
    Throwable root = rootCause(throwable);
    if (root instanceof R2dbcException r2dbcException) {
      if ("55P03".equals(r2dbcException.getSqlState())) {
        return new CheckoutBusyException("Checkout busy, please retry");
      }
      String message = r2dbcException.getMessage();
      if (message != null && message.contains("INSUFFICIENT_STOCK")) {
        return new InsufficientStockException("Insufficient stock");
      }
    }
    return throwable;
  }

  private Throwable rootCause(Throwable throwable) {
    Throwable current = throwable;
    while (current.getCause() != null && current.getCause() != current) {
      current = current.getCause();
    }
    return current;
  }
}
