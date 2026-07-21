package com.takypok.employeeservice.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UnregisterDeviceTokenRequest {
  @NotBlank private String fcmToken;
}
