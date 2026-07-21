package com.takypok.employeeservice.model.event;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DeviceTokenEvent {
  private UUID eventId = UUID.randomUUID();
  private DeviceTokenEventType eventType;
  private String sub;
  private String platform;
  private String fcmToken;

  public DeviceTokenEvent(
      DeviceTokenEventType eventType, String sub, String platform, String fcmToken) {
    this.eventType = eventType;
    this.sub = sub;
    this.platform = platform;
    this.fcmToken = fcmToken;
  }
}
