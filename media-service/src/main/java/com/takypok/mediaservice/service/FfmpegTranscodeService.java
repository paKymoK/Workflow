package com.takypok.mediaservice.service;

import com.takypok.mediaservice.ffmpeg.FfmpegResolver;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class FfmpegTranscodeService {

  // {quality, scale, videoBitrate, audioBitrate}
  private static final String[][] QUALITIES = {
    {"360p", "640:360", "800k", "96k"},
  };

  private final FfmpegResolver ffmpegResolver;
  private final VideoStorageService storageService;

  public Mono<Void> transcode(String videoId) {
    return Mono.fromCallable(
            () -> {
              List<String> cmd = buildCommand(videoId);
              runProcess(videoId, cmd);
              return (Void) null;
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private List<String> buildCommand(String videoId) throws Exception {
    List<String> cmd = new ArrayList<>();
    cmd.add(ffmpegResolver.resolve());
    cmd.add("-i");
    cmd.add(storageService.rawPath(videoId).toString());

    for (String[] q : QUALITIES) {
      String quality = q[0];
      String scale = q[1];
      String vBitrate = q[2];
      String aBitrate = q[3];

      Files.createDirectories(storageService.qualityDir(videoId, quality));
      String segmentPattern =
          storageService.qualityDir(videoId, quality).resolve("seg_%03d.ts").toString();
      String playlist =
          storageService.qualityDir(videoId, quality).resolve("index.m3u8").toString();

      cmd.addAll(
          List.of(
              "-map",
              "0:v",
              "-map",
              "0:a",
              "-vf",
              "scale=" + scale,
              "-b:v",
              vBitrate,
              "-b:a",
              aBitrate,
              "-hls_time",
              "6",
              "-hls_playlist_type",
              "vod",
              "-hls_segment_filename",
              segmentPattern,
              playlist));
    }
    return cmd;
  }

  private void runProcess(String videoId, List<String> cmd) throws Exception {
    log.info("[FFmpeg] Starting transcode for video {}", videoId);
    ProcessBuilder pb = new ProcessBuilder(cmd);
    pb.redirectErrorStream(true);
    Process p = pb.start();

    // Drain stdout+stderr — required to prevent process hanging on full pipe buffer
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
      String line;
      while ((line = reader.readLine()) != null) {
        log.debug("[FFmpeg] {}", line);
      }
    }

    int exitCode = p.waitFor();
    if (exitCode != 0) {
      throw new RuntimeException("FFmpeg exited with code " + exitCode + " for video " + videoId);
    }
    log.info("[FFmpeg] Transcode complete for video {}", videoId);
  }
}
