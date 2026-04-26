package com.takypok.shopservice.repository;

import com.takypok.shopservice.model.entity.Order;
import java.time.ZonedDateTime;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrderRepository extends R2dbcRepository<Order, Long> {
  Mono<Order> findByOrderId(String orderId);

  Flux<Order> findByStatusAndCreatedAtBefore(String status, ZonedDateTime cutoff);
}
