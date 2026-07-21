package com.takypok.employeeservice.service;

import reactor.core.publisher.Mono;

public interface DeviceTokenService {
  Mono<Void> register(String sub, String platform, String fcmToken);

  Mono<Void> unregister(String sub, String fcmToken);
}
