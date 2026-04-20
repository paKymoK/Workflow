package com.takypok.shopservice.repository;

import com.takypok.shopservice.model.entity.Cart;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface CartRepository extends R2dbcRepository<Cart, Long> {
  Mono<Cart> findByUserIdAndStatus(String userId, String status);
}
