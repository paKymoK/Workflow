package com.takypok.mediaservice.repository;

import com.takypok.mediaservice.model.VideoJob;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface VideoJobRepository extends R2dbcRepository<VideoJob, String> {
  Mono<Void> deleteByVideoId(String videoId);
}
