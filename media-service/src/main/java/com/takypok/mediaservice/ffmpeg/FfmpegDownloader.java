package com.takypok.mediaservice.ffmpeg;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.time.Duration;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class FfmpegDownloader {

  private static final Map<OsArchPlatform, String> DOWNLOAD_URLS =
      Map.of(
          OsArchPlatform.LINUX_X64,
              "https://www.johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
          OsArchPlatform.LINUX_ARM64,
              "https://www.johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz",
          OsArchPlatform.MAC_X64, "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip",
          OsArchPlatform.MAC_ARM64, "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip",
          OsArchPlatform.WINDOWS_X64,
              "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip");

  public String download(OsArchPlatform platform, Path cacheDir, int timeoutSeconds)
      throws Exception {
    String url = DOWNLOAD_URLS.get(platform);
    String binaryName = platform == OsArchPlatform.WINDOWS_X64 ? "ffmpeg.exe" : "ffmpeg";

    log.info("Downloading FFmpeg for {} from {}", platform, url);

    Path tempFile = Files.createTempFile("ffmpeg-download-", isTarXz(url) ? ".tar.xz" : ".zip");
    try {
      HttpClient client =
          HttpClient.newBuilder()
              .followRedirects(HttpClient.Redirect.ALWAYS)
              .connectTimeout(Duration.ofSeconds(30))
              .build();

      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(url))
              .timeout(Duration.ofSeconds(timeoutSeconds))
              .build();

      client.send(request, HttpResponse.BodyHandlers.ofFile(tempFile));
      log.info("Download complete ({} bytes), extracting...", Files.size(tempFile));

      Files.createDirectories(cacheDir);

      Path binaryPath =
          isTarXz(url)
              ? extractTarXz(tempFile, cacheDir, binaryName)
              : extractZip(tempFile, cacheDir, binaryName);

      if (platform != OsArchPlatform.WINDOWS_X64) {
        setExecutable(binaryPath);
      }

      log.info("FFmpeg binary ready at: {}", binaryPath);
      return binaryPath.toString();
    } finally {
      Files.deleteIfExists(tempFile);
    }
  }

  private boolean isTarXz(String url) {
    return url.endsWith(".tar.xz");
  }

  private Path extractZip(Path zipFile, Path destDir, String binaryName) throws IOException {
    try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile.toFile()))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        String filename = Path.of(entry.getName()).getFileName().toString();
        if (filename.equals(binaryName)) {
          Path dest = destDir.resolve(binaryName);
          Files.copy(zis, dest, StandardCopyOption.REPLACE_EXISTING);
          return dest;
        }
      }
    }
    throw new IOException("Could not find " + binaryName + " in zip archive");
  }

  private Path extractTarXz(Path tarFile, Path destDir, String binaryName)
      throws IOException, InterruptedException {
    Path extractDir = destDir.resolve("extract-tmp");
    Files.createDirectories(extractDir);
    try {
      ProcessBuilder pb =
          new ProcessBuilder("tar", "-xJf", tarFile.toString(), "-C", extractDir.toString());
      pb.redirectErrorStream(true);
      Process p = pb.start();
      String output = new String(p.getInputStream().readAllBytes());
      int exitCode = p.waitFor();
      if (exitCode != 0) {
        throw new IOException("tar extraction failed (exit " + exitCode + "): " + output);
      }

      Path binary =
          Files.walk(extractDir)
              .filter(f -> f.getFileName().toString().equals(binaryName))
              .filter(f -> !Files.isDirectory(f))
              .findFirst()
              .orElseThrow(
                  () -> new IOException("Could not find " + binaryName + " in extracted archive"));

      Path dest = destDir.resolve(binaryName);
      Files.move(binary, dest, StandardCopyOption.REPLACE_EXISTING);
      return dest;
    } finally {
      if (Files.exists(extractDir)) {
        Files.walk(extractDir)
            .sorted(Comparator.reverseOrder())
            .forEach(
                f -> {
                  try {
                    Files.delete(f);
                  } catch (IOException ignored) {
                  }
                });
      }
    }
  }

  private void setExecutable(Path path) throws IOException {
    Set<PosixFilePermission> perms = new HashSet<>(Files.getPosixFilePermissions(path));
    perms.add(PosixFilePermission.OWNER_EXECUTE);
    perms.add(PosixFilePermission.GROUP_EXECUTE);
    perms.add(PosixFilePermission.OTHERS_EXECUTE);
    Files.setPosixFilePermissions(path, perms);
  }
}
