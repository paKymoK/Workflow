package com.takypok.mediaservice.ffmpeg;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.util.HashSet;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FfmpegResolver {

  @Value("${ffmpeg.cache-dir:~/.cache/media-service/ffmpeg}")
  private String cacheDir;

  private String resolvedPath;
  private String resolvedProbePath;

  @PostConstruct
  public void init() throws IOException {
    boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
    resolvedPath = extractFromClasspath(isWindows ? "ffmpeg.exe" : "ffmpeg", isWindows);
    resolvedProbePath = extractFromClasspath(isWindows ? "ffprobe.exe" : "ffprobe", isWindows);
    log.info("[FFmpeg] Resolved ffmpeg at: {}", resolvedPath);
    log.info("[FFmpeg] Resolved ffprobe at: {}", resolvedProbePath);
  }

  public String resolve() {
    return resolvedPath;
  }

  public String resolveProbe() {
    return resolvedProbePath;
  }

  private String extractFromClasspath(String binaryName, boolean isWindows) throws IOException {
    String resourcePath = "/org/bytedeco/ffmpeg/" + getPlatformDir() + "/" + binaryName;

    Path dest = expandedCacheDir().resolve(binaryName);
    Files.createDirectories(dest.getParent());

    try (InputStream in = FfmpegResolver.class.getResourceAsStream(resourcePath)) {
      if (in == null) {
        throw new IllegalStateException("FFmpeg binary not found in classpath at: " + resourcePath);
      }
      Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
    }

    if (!isWindows) {
      Set<PosixFilePermission> perms = new HashSet<>(Files.getPosixFilePermissions(dest));
      perms.add(PosixFilePermission.OWNER_EXECUTE);
      perms.add(PosixFilePermission.GROUP_EXECUTE);
      perms.add(PosixFilePermission.OTHERS_EXECUTE);
      Files.setPosixFilePermissions(dest, perms);
    }

    return dest.toString();
  }

  private String getPlatformDir() {
    String os = System.getProperty("os.name").toLowerCase();
    String arch = System.getProperty("os.arch").toLowerCase();
    boolean isArm = arch.contains("aarch64") || arch.contains("arm");

    if (os.contains("win")) return "windows-x86_64";
    if (os.contains("mac")) return isArm ? "macosx-arm64" : "macosx-x86_64";
    return isArm ? "linux-arm64" : "linux-x86_64";
  }

  private Path expandedCacheDir() {
    return Path.of(cacheDir.replace("~", System.getProperty("user.home")));
  }
}
