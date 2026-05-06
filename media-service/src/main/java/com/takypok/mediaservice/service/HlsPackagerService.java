package com.takypok.mediaservice.service;

import java.nio.file.Files;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class HlsPackagerService {

  private static final String MASTER_PLAYLIST =
      "#EXTM3U\n"
          + "#EXT-X-VERSION:3\n"
          + "\n"
          + "#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360\n"
          + "360p/index.m3u8\n";

  private final VideoStorageService storageService;

  public Mono<Void> writeMasterPlaylist(String videoId) {
    return Mono.fromCallable(
            () -> {
              Files.createDirectories(storageService.hlsDir(videoId));
              Files.writeString(
                  storageService.hlsDir(videoId).resolve("master.m3u8"), MASTER_PLAYLIST);
              log.info("[HLS] Master playlist written for video {}", videoId);
              return (Void) null;
            })
        .subscribeOn(Schedulers.boundedElastic());
  }
}
