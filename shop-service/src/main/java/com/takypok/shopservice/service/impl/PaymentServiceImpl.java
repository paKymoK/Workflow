package com.takypok.shopservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.shopservice.config.VnpayConfig;
import com.takypok.shopservice.model.entity.CartItem;
import com.takypok.shopservice.model.entity.Order;
import com.takypok.shopservice.model.response.PaymentCreateResponse;
import com.takypok.shopservice.repository.CartItemRepository;
import com.takypok.shopservice.repository.OrderRepository;
import com.takypok.shopservice.service.PaymentService;
import com.takypok.shopservice.util.VnpayUtil;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

  private final OrderRepository orderRepository;
  private final CartItemRepository cartItemRepository;
  private final DatabaseClient databaseClient;
  private final VnpayConfig vnpayConfig;

  private final ConcurrentHashMap<String, Sinks.Many<String>> sinkRegistry =
      new ConcurrentHashMap<>();

  @Override
  public Mono<PaymentCreateResponse> createPayment(String orderId, String ipAddress) {
    return orderRepository
        .findByOrderId(orderId)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Order not found")))
        .map(
            order -> {
              String paymentUrl =
                  VnpayUtil.buildPaymentUrl(
                      vnpayConfig.getTmnCode(),
                      vnpayConfig.getHashSecret(),
                      vnpayConfig.getUrl(),
                      vnpayConfig.getReturnUrl(),
                      order.getOrderId(),
                      order.getTotalAmount(),
                      ipAddress);
              return PaymentCreateResponse.builder()
                  .orderId(orderId)
                  .paymentUrl(paymentUrl)
                  .build();
            });
  }

  @Override
  public Flux<ServerSentEvent<String>> streamPaymentStatus(String orderId) {
    Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();
    sinkRegistry.put(orderId, sink);

    return sink.asFlux()
        .map(event -> ServerSentEvent.<String>builder().data(event).build())
        .timeout(
            Duration.ofMinutes(15),
            Flux.just(ServerSentEvent.<String>builder().event("timeout").data("timeout").build()))
        .doFinally(signal -> sinkRegistry.remove(orderId));
  }

  @Override
  @Transactional
  public Mono<Void> confirmPayment(String orderId) {
    return orderRepository
        .findByOrderId(orderId)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Order not found")))
        .flatMap(
            order -> {
              if (!Order.STATUS_PENDING_PAYMENT.equals(order.getStatus())) {
                return Mono.just(order);
              }
              order.setStatus(Order.STATUS_PAID);
              return orderRepository.save(order);
            })
        .doOnNext(
            order -> {
              Sinks.Many<String> sink = sinkRegistry.get(orderId);
              if (sink != null) {
                sink.tryEmitNext("paid");
                sink.tryEmitComplete();
              }
            })
        .then();
  }

  @Override
  public Mono<Void> cancelExpiredOrders() {
    ZonedDateTime cutoff = ZonedDateTime.now().minusMinutes(15);
    return orderRepository
        .findByStatusAndCreatedAtBefore(Order.STATUS_PENDING_PAYMENT, cutoff)
        .flatMap(this::cancelOrder)
        .then();
  }

  private Mono<Void> cancelOrder(Order order) {
    return cartItemRepository
        .findByCartId(order.getCartId())
        .collectList()
        .flatMap(
            items ->
                restoreStock(items)
                    .then(
                        Mono.defer(
                            () -> {
                              order.setStatus(Order.STATUS_CANCELLED);
                              return orderRepository.save(order).then();
                            })))
        .onErrorResume(
            ex -> {
              log.error("Failed to cancel order {}: {}", order.getOrderId(), ex.getMessage(), ex);
              return Mono.empty();
            });
  }

  private Mono<Void> restoreStock(List<CartItem> items) {
    return Flux.fromIterable(items)
        .concatMap(
            item ->
                databaseClient
                    .sql("UPDATE product SET stock = stock + :qty WHERE id = :productId")
                    .bind("qty", item.getQuantity())
                    .bind("productId", item.getProductId())
                    .fetch()
                    .rowsUpdated()
                    .then())
        .then();
  }
}
