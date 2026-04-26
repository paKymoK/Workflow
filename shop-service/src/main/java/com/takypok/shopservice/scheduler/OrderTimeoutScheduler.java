package com.takypok.shopservice.scheduler;

import com.takypok.shopservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderTimeoutScheduler {

  private final PaymentService paymentService;

  @Scheduled(fixedDelay = 60_000)
  public void cancelExpiredOrders() {
    paymentService
        .cancelExpiredOrders()
        .subscribe(null, ex -> log.error("Error in order timeout job: {}", ex.getMessage(), ex));
  }
}
