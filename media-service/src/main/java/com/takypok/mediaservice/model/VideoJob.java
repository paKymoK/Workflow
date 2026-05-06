package com.takypok.mediaservice.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoJob {
  private String jobId;
  private String videoId;
  private volatile JobStatus status;
  private volatile String errorMessage;
  private Instant createdAt;
  private volatile Instant startedAt;
  private volatile Instant completedAt;
}
