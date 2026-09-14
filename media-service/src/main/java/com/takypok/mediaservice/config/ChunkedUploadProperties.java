package com.takypok.mediaservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "media.chunked-upload")
@Getter
@Setter
public class ChunkedUploadProperties {
  /**
   * The fixed size every chunk except the last must be. This isn't just a validation ceiling — the
   * server uses it to compute each chunk's write offset ({@code index * chunkSizeBytes}), so
   * clients must slice to exactly this size (the /start response echoes it back for that reason).
   */
  private long chunkSizeBytes = 8L * 1024; // 8 KB

  private long maxTotalSizeBytes = 200L * 1024 * 1024; // 200 MB
  private long sessionIdleTimeoutSeconds = 900; // 15 min
  private long sweepIntervalSeconds = 60;
  private int maxActiveSessions = 200;
}
