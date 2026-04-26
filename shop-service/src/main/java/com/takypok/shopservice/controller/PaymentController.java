package com.takypok.shopservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.shopservice.config.VnpayConfig;
import com.takypok.shopservice.model.request.CreatePaymentRequest;
import com.takypok.shopservice.model.response.PaymentCreateResponse;
import com.takypok.shopservice.service.PaymentService;
import com.takypok.shopservice.util.VnpayUtil;
import jakarta.validation.Valid;
import java.net.InetSocketAddress;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/payment")
public class PaymentController {

  private final PaymentService paymentService;
  private final VnpayConfig vnpayConfig;

  @PostMapping("/create")
  public Mono<ResultMessage<PaymentCreateResponse>> createPayment(
      @Valid @RequestBody CreatePaymentRequest request, ServerHttpRequest httpRequest) {
    String ipAddress = extractIpAddress(httpRequest);
    return paymentService
        .createPayment(request.getOrderId(), ipAddress)
        .map(ResultMessage::success);
  }

  @GetMapping(value = "/stream/{orderId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<ServerSentEvent<String>> streamPaymentStatus(@PathVariable String orderId) {
    return paymentService.streamPaymentStatus(orderId);
  }

  @GetMapping("/vnpay-ipn")
  public Mono<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
    if (!VnpayUtil.verifySignature(vnpayConfig.getHashSecret(), params)) {
      return Mono.just(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
    }

    String responseCode = params.get("vnp_ResponseCode");
    String orderId = params.get("vnp_TxnRef");

    if (!"00".equals(responseCode)) {
      return Mono.just(Map.of("RspCode", "00", "Message", "Confirm Success"));
    }

    return paymentService
        .confirmPayment(orderId)
        .thenReturn(Map.of("RspCode", "00", "Message", "Confirm Success"))
        .onErrorReturn(Map.of("RspCode", "02", "Message", "Order not found or already processed"));
  }

  @GetMapping("/vnpay-return")
  public Mono<Map<String, String>> vnpayReturn(@RequestParam Map<String, String> params) {
    String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
    if ("00".equals(responseCode)) {
      return Mono.just(Map.of("RspCode", "00", "Message", "Payment successful"));
    }
    return Mono.just(Map.of("RspCode", responseCode, "Message", "Payment not completed"));
  }

  private String extractIpAddress(ServerHttpRequest request) {
    String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isBlank()) {
      return xForwardedFor.split(",")[0].trim();
    }
    InetSocketAddress remoteAddress = request.getRemoteAddress();
    return remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "127.0.0.1";
  }
}
