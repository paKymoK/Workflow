package com.takypok.chatservice.service.impl;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.takypok.chatservice.service.FcmSenderService;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/** Wraps the Firebase Admin SDK's blocking client on a bounded-elastic scheduler. */
@Slf4j
@Service
public class FcmSenderServiceImpl implements FcmSenderService {

  @Override
  public Mono<Void> send(String fcmToken, String title, String body, Map<String, String> data) {
    if (FirebaseApp.getApps().isEmpty()) {
      log.warn(
          "Skipping FCM send to token ending in ...{} — Firebase is not configured",
          suffix(fcmToken));
      return Mono.empty();
    }
    return Mono.fromCallable(
            () -> {
              Message.Builder builder =
                  Message.builder()
                      .setToken(fcmToken)
                      .setNotification(
                          Notification.builder().setTitle(title).setBody(body).build());
              if (data != null) {
                builder.putAllData(data);
              }
              return FirebaseMessaging.getInstance().send(builder.build());
            })
        .subscribeOn(Schedulers.boundedElastic())
        .doOnError(
            ex ->
                log.error(
                    "Failed to send FCM push to token ending in ...{}: {}",
                    suffix(fcmToken),
                    ex.getMessage(),
                    ex))
        .onErrorResume(ex -> Mono.empty())
        .then();
  }

  private String suffix(String fcmToken) {
    return fcmToken == null || fcmToken.length() < 6
        ? "?"
        : fcmToken.substring(fcmToken.length() - 6);
  }
}
