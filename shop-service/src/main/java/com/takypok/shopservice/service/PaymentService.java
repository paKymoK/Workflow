package com.takypok.shopservice.service;

import com.takypok.shopservice.model.response.PaymentCreateResponse;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PaymentService {
  Mono<PaymentCreateResponse> createPayment(String orderId, String ipAddress);

  Flux<ServerSentEvent<String>> streamPaymentStatus(String orderId);

  Mono<Void> confirmPayment(String orderId);

  Mono<Void> cancelExpiredOrders();
}
