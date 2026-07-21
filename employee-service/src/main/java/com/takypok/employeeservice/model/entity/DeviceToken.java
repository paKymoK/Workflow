package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeviceToken extends IdEntity {
  private String sub;
  private Platform platform;
  private String fcmToken;
  private ZonedDateTime lastUsedAt;
}
