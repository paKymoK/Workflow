package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterDeviceTokenRequest {
  @NotNull private Platform platform;
  @NotBlank private String fcmToken;
}
