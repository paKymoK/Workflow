package com.takypok.employeeservice.service.impl;

import com.takypok.employeeservice.model.event.DeviceTokenEventType;
import com.takypok.employeeservice.repository.DeviceTokenRepository;
import com.takypok.employeeservice.service.DeviceTokenEventPublisher;
import com.takypok.employeeservice.service.DeviceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class DeviceTokenServiceImpl implements DeviceTokenService {
  private final DeviceTokenRepository deviceTokenRepository;
  private final DeviceTokenEventPublisher eventPublisher;

  @Override
  public Mono<Void> register(String sub, String platform, String fcmToken) {
    return deviceTokenRepository
        .upsert(sub, platform, fcmToken)
        .then(eventPublisher.publish(DeviceTokenEventType.REGISTERED, sub, platform, fcmToken));
  }

  @Override
  public Mono<Void> unregister(String sub, String fcmToken) {
    return deviceTokenRepository
        .deleteBySubAndFcmToken(sub, fcmToken)
        .then(eventPublisher.publish(DeviceTokenEventType.UNREGISTERED, sub, null, fcmToken));
  }
}
