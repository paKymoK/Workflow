package com.takypok.mediaservice.ffmpeg;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class FfmpegResolver {

  @Value("${ffmpeg.path:}")
  private String configuredPath;

  @Value("${ffmpeg.cache-dir:~/.cache/media-service/ffmpeg}")
  private String cacheDir;

  @Value("${ffmpeg.download-timeout-seconds:120}")
  private int downloadTimeoutSeconds;

  private final FfmpegDownloader downloader;
  private final PlatformDetector platformDetector;

  private String resolvedPath;

  @PostConstruct
  public void init() {
    resolvedPath =
        buildResolutionChain()
            .subscribeOn(Schedulers.boundedElastic())
            .block(Duration.ofSeconds(downloadTimeoutSeconds + 60));
  }

  public String resolve() {
    return resolvedPath;
  }

  public String resolveProbe() {
    String probe = resolvedPath.replaceAll("ffmpeg(\\.exe)?$", "ffprobe$1");
    File f = new File(probe);
    return (f.exists() && f.canExecute()) ? probe : "ffprobe";
  }

  private Mono<String> buildResolutionChain() {
    return Mono.fromCallable(this::tryConfiguredPath)
        .filter(p -> p != null)
        .doOnNext(p -> log.info("[FFmpeg] Step 1 resolved via configured/env path: {}", p))
        .switchIfEmpty(
            Mono.fromCallable(this::trySystemPath)
                .filter(p -> p != null)
                .doOnNext(p -> log.info("[FFmpeg] Step 2 resolved via system PATH: {}", p)))
        .switchIfEmpty(
            Mono.fromCallable(this::tryCachedBinary)
                .filter(p -> p != null)
                .doOnNext(p -> log.info("[FFmpeg] Step 3 resolved via cache: {}", p)))
        .switchIfEmpty(
            downloadBinary()
                .doOnNext(p -> log.info("[FFmpeg] Step 4 resolved via auto-download: {}", p)))
        .switchIfEmpty(
            Mono.error(
                new IllegalStateException(
                    "FFmpeg could not be resolved — all 4 steps failed. "
                        + "Set FFMPEG_PATH or ensure ffmpeg is installed.")));
  }

  private String tryConfiguredPath() {
    if (configuredPath == null || configuredPath.isBlank()) {
      log.debug("[FFmpeg] Step 1 skipped: ffmpeg.path not set");
      return null;
    }
    File f = new File(configuredPath);
    if (f.exists() && f.canExecute()) {
      return configuredPath;
    }
    log.warn("[FFmpeg] Step 1 skipped: {} does not exist or is not executable", configuredPath);
    return null;
  }

  private String trySystemPath() {
    try {
      ProcessBuilder pb = new ProcessBuilder(isWindows() ? "where" : "which", "ffmpeg");
      pb.redirectErrorStream(true);
      Process p = pb.start();
      boolean finished = p.waitFor(5, TimeUnit.SECONDS);
      if (!finished) {
        p.destroyForcibly();
        log.debug("[FFmpeg] Step 2 skipped: which/where timed out");
        return null;
      }
      String path = new String(p.getInputStream().readAllBytes()).trim();
      if (p.exitValue() == 0 && !path.isEmpty()) {
        return path.lines().findFirst().orElse(null);
      }
    } catch (Exception e) {
      log.debug("[FFmpeg] Step 2 skipped: {}", e.getMessage());
    }
    return null;
  }

  private String tryCachedBinary() {
    String binaryName = isWindows() ? "ffmpeg.exe" : "ffmpeg";
    Path cached = expandedCacheDir().resolve(binaryName);
    if (Files.exists(cached) && cached.toFile().canExecute()) {
      return cached.toString();
    }
    log.debug("[FFmpeg] Step 3 skipped: no cached binary at {}", cached);
    return null;
  }

  private Mono<String> downloadBinary() {
    return Mono.fromCallable(
            () -> {
              OsArchPlatform platform = platformDetector.detect();
              log.info("[FFmpeg] Step 4 starting download for platform {}", platform);
              return downloader.download(platform, expandedCacheDir(), downloadTimeoutSeconds);
            })
        .subscribeOn(Schedulers.boundedElastic())
        .onErrorMap(
            e ->
                new IllegalStateException("[FFmpeg] Step 4 download failed: " + e.getMessage(), e));
  }

  private Path expandedCacheDir() {
    return Path.of(cacheDir.replace("~", System.getProperty("user.home")));
  }

  private boolean isWindows() {
    return System.getProperty("os.name").toLowerCase().contains("win");
  }
}
