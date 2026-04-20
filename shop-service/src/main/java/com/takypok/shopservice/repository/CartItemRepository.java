package com.takypok.shopservice.repository;

import com.takypok.shopservice.model.entity.CartItem;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CartItemRepository extends R2dbcRepository<CartItem, Long> {
  Flux<CartItem> findByCartId(Long cartId);

  Mono<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

  @Modifying
  @Query("DELETE FROM cart_item WHERE cart_id = :cartId AND product_id = :productId")
  Mono<Integer> deleteByCartIdAndProductId(Long cartId, Long productId);
}
