package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.DeviceToken;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DeviceTokenRepository extends R2dbcRepository<DeviceToken, Long> {

  @Modifying
  @Query(
      """
      INSERT INTO device_token (sub, platform, fcm_token, last_used_at)
      VALUES (:sub, :platform, :fcmToken, now())
      ON CONFLICT (fcm_token) DO UPDATE
        SET sub = EXCLUDED.sub, platform = EXCLUDED.platform, last_used_at = now()
      """)
  Mono<Void> upsert(String sub, String platform, String fcmToken);

  Mono<Void> deleteBySubAndFcmToken(String sub, String fcmToken);

  Flux<DeviceToken> findBySub(String sub);
}
