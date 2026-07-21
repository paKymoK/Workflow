package com.takypok.employeeservice.model.event;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Fanned out to chat-service, which sends FCM pushes to recipients with no live WS session. */
@Getter
@Setter
@NoArgsConstructor
public class NotificationEvent {
  private UUID eventId = UUID.randomUUID();
  private String title;
  private String body;
  private List<String> recipientSubs;
  private Map<String, String> data;

  public NotificationEvent(
      String title, String body, List<String> recipientSubs, Map<String, String> data) {
    this.title = title;
    this.body = body;
    this.recipientSubs = recipientSubs;
    this.data = data;
  }
}
