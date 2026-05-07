package com.takypok.mediaservice.service;

import com.takypok.mediaservice.model.JobResponse;
import com.takypok.mediaservice.model.JobStatus;
import com.takypok.mediaservice.model.VideoJob;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranscodeJobService {

  private final VideoUploadService uploadService;
  private final FfmpegTranscodeService transcodeService;
  private final HlsPackagerService hlsPackagerService;
  private final VideoStorageService storageService;

  private final ConcurrentHashMap<String, VideoJob> jobs = new ConcurrentHashMap<>();

  public Mono<JobResponse> submitUpload(FilePart filePart) {
    String videoId = UUID.randomUUID().toString();
    String jobId = UUID.randomUUID().toString();

    VideoJob job =
        VideoJob.builder()
            .jobId(jobId)
            .videoId(videoId)
            .status(JobStatus.QUEUED)
            .createdAt(Instant.now())
            .build();
    jobs.put(jobId, job);

    // Stream file to disk first, then fire async transcode
    return uploadService
        .save(filePart.content(), videoId)
        .doOnSuccess(ignored -> startTranscode(job))
        .thenReturn(
            new JobResponse(
                videoId, jobId, JobStatus.QUEUED, "Upload received, transcoding queued"));
  }

  public Optional<VideoJob> getJob(String jobId) {
    return Optional.ofNullable(jobs.get(jobId));
  }

  public Mono<Void> removeJobsForVideo(String videoId) {
    return Mono.fromRunnable(() -> jobs.values().removeIf(j -> videoId.equals(j.getVideoId())));
  }

  private void startTranscode(VideoJob job) {
    job.setStatus(JobStatus.PROCESSING);
    job.setStartedAt(Instant.now());

    transcodeService
        .transcode(job.getVideoId())
        .flatMap(qualities -> hlsPackagerService.writeMasterPlaylist(job.getVideoId(), qualities))
        .doOnSuccess(
            v -> {
              job.setStatus(JobStatus.DONE);
              job.setCompletedAt(Instant.now());
              log.info("Job {} completed for video {}", job.getJobId(), job.getVideoId());
            })
        .doOnError(
            e -> {
              job.setStatus(JobStatus.FAILED);
              job.setErrorMessage(e.getMessage());
              job.setCompletedAt(Instant.now());
              log.error("Job {} failed: {}", job.getJobId(), e.getMessage());
            })
        .subscribeOn(Schedulers.boundedElastic())
        .subscribe();
  }
}
