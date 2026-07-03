package com.takypok.mediaservice.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Persisted (rather than held in a ConcurrentHashMap) so job status survives a restart and is
 * visible from any media-service instance, not just the one that received the upload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("video_job")
public class VideoJob {
  @Id
  @Column("job_id")
  private String jobId;

  @Column("video_id")
  private String videoId;

  private JobStatus status;

  @Column("error_message")
  private String errorMessage;

  @Column("created_at")
  private Instant createdAt;

  @Column("started_at")
  private Instant startedAt;

  @Column("completed_at")
  private Instant completedAt;
}
