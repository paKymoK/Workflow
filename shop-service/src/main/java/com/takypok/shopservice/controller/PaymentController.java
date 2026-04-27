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

  @GetMapping(
      value = "/vnpay-return",
      produces = org.springframework.http.MediaType.TEXT_HTML_VALUE)
  public Mono<String> vnpayReturn(@RequestParam Map<String, String> params) {
    String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
    boolean success =
        "00".equals(responseCode) && VnpayUtil.verifySignature(vnpayConfig.getHashSecret(), params);

    if (success) {
      String orderId = params.get("vnp_TxnRef");
      return paymentService
          .confirmPayment(orderId)
          .onErrorResume(e -> Mono.empty())
          .thenReturn(buildReturnHtml(true));
    }
    return Mono.just(buildReturnHtml(false));
  }

  private static String buildReturnHtml(boolean success) {
    String message = success ? "Payment successful!" : "Payment was not completed.";
    String color = success ? "#52c41a" : "#ff4d4f";
    return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Payment Result</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;
                    font-family:sans-serif;font-size:1.2rem;color:%s;margin:0">
          <div>%s<br><small style="color:#888;font-size:.9rem">This window will close automatically…</small></div>
          <script>setTimeout(function(){ window.close(); }, 3000);</script>
        </body>
        </html>
        """
        .formatted(color, message);
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
