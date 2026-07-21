package com.takypok.employeeservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.employeeservice.model.request.RegisterDeviceTokenRequest;
import com.takypok.employeeservice.model.request.UnregisterDeviceTokenRequest;
import com.takypok.employeeservice.service.DeviceTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/notifications")
public class NotificationController {
  private final DeviceTokenService deviceTokenService;

  @PostMapping("/register-token")
  public Mono<ResultMessage<Void>> registerToken(
      @RequestBody @Valid RegisterDeviceTokenRequest request, Authentication authentication) {
    return deviceTokenService
        .register(authentication.getName(), request.getPlatform().name(), request.getFcmToken())
        .thenReturn(ResultMessage.success(null));
  }

  @PostMapping("/unregister-token")
  public Mono<ResultMessage<Void>> unregisterToken(
      @RequestBody @Valid UnregisterDeviceTokenRequest request, Authentication authentication) {
    return deviceTokenService
        .unregister(authentication.getName(), request.getFcmToken())
        .thenReturn(ResultMessage.success(null));
  }
}
