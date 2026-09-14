import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Command-line equivalent of the browser's encrypted chunked upload (see
 * frontend/takypok-frontend/src/lib/chunkedUpload.ts#uploadFileChunkedEncrypted and
 * media-service ChunkedUploadServiceImpl#writeChunkEncrypted): splits a file into the server's
 * chunk size, AES-GCM encrypts each chunk with the same fixed key, and uploads it through the
 * /start -> /chunks/{index}/encrypted -> /finish flow. Useful for driving that flow without a
 * browser (scripted testing against a network that content-inspects uploads).
 *
 * Run with a JDK 11+ runtime, no build step required:
 *   java ChunkedUploadCli.java <file> [--base-url URL] [--token TOKEN]
 *
 * The chunk endpoints sit behind the gateway's normal auth, so a valid access token is required.
 * There's no scripted login here - copy one out of the app's own session (DevTools -> Application
 * -> Session Storage, while logged in) and pass it via --token or the WORKFLOW_ACCESS_TOKEN env
 * var.
 */
public class ChunkedUploadCli {
  // Must match ChunkedUploadProperties#encryptionKeyBase64 (backend) and ENCRYPTION_KEY_B64 in
  // chunkedUpload.ts (frontend) exactly - it's a shared constant, not looked up at runtime.
  private static final String ENCRYPTION_KEY_B64 = "UUF1mzp0rKSFTi8GEiS9P4kVJN6VaFfwZuZ5EPevtLA=";
  private static final int GCM_IV_LENGTH_BYTES = 12;
  private static final int GCM_TAG_LENGTH_BITS = 128;

  private static final Pattern SESSION_ID_PATTERN =
      Pattern.compile("\"sessionId\"\\s*:\\s*\"([^\"]+)\"");
  private static final Pattern CHUNK_SIZE_PATTERN =
      Pattern.compile("\"chunkSizeBytes\"\\s*:\\s*(\\d+)");

  public static void main(String[] args) throws Exception {
    if (args.length == 0) {
      printUsage();
      System.exit(1);
    }

    Path file = Path.of(args[0]);
    String baseUrl = envOrDefault("WORKFLOW_API_BASE_URL", "http://localhost:8080");
    String token = System.getenv("WORKFLOW_ACCESS_TOKEN");

    for (int i = 1; i < args.length; i++) {
      switch (args[i]) {
        case "--base-url" -> baseUrl = args[++i];
        case "--token" -> token = args[++i];
        default -> throw new IllegalArgumentException("Unknown argument: " + args[i]);
      }
    }

    if (!Files.isRegularFile(file)) {
      System.err.println("No such file: " + file);
      System.exit(1);
    }
    if (token == null || token.isBlank()) {
      System.err.println(
          "Missing access token. Pass --token <jwt> or set WORKFLOW_ACCESS_TOKEN (copy it from "
              + "the app's Session Storage in DevTools while logged in).");
      System.exit(1);
    }

    byte[] data = Files.readAllBytes(file);
    String filename = file.getFileName().toString();
    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    String chunkedBase = trimTrailingSlash(baseUrl) + "/media-service/v1/upload/chunked";

    String startBody =
        "{\"sessionId\":\""
            + UUID.randomUUID()
            + "\",\"filename\":\""
            + jsonEscape(filename)
            + "\",\"totalSizeBytes\":"
            + data.length
            + "}";
    String startResponse =
        post(client, chunkedBase + "/start", token, "application/json", startBody.getBytes());

    Matcher sessionMatcher = SESSION_ID_PATTERN.matcher(startResponse);
    Matcher chunkSizeMatcher = CHUNK_SIZE_PATTERN.matcher(startResponse);
    if (!sessionMatcher.find() || !chunkSizeMatcher.find()) {
      throw new IllegalStateException("Unexpected /start response: " + startResponse);
    }
    String sessionId = sessionMatcher.group(1);
    int chunkSizeBytes = Integer.parseInt(chunkSizeMatcher.group(1));
    int totalChunks = Math.max(1, (int) Math.ceil(data.length / (double) chunkSizeBytes));

    System.out.println(
        "Session " + sessionId + " - " + totalChunks + " chunk(s) of " + chunkSizeBytes + " bytes");

    SecretKeySpec key = new SecretKeySpec(Base64.getDecoder().decode(ENCRYPTION_KEY_B64), "AES");
    SecureRandom random = new SecureRandom();

    for (int index = 0; index < totalChunks; index++) {
      int start = index * chunkSizeBytes;
      int end = Math.min(start + chunkSizeBytes, data.length);
      byte[] wire = encryptChunk(key, random, data, start, end);
      post(
          client,
          chunkedBase + "/" + sessionId + "/chunks/" + index + "/encrypted",
          token,
          "application/octet-stream",
          wire);
      System.out.println("  chunk " + index + " sent (" + (end - start) + " plaintext bytes)");
    }

    String finishBody = "{\"totalChunks\":" + totalChunks + "}";
    String finishResponse =
        post(
            client,
            chunkedBase + "/" + sessionId + "/finish",
            token,
            "application/json",
            finishBody.getBytes());
    System.out.println("Done: " + finishResponse);
  }

  private static byte[] encryptChunk(
      SecretKeySpec key, SecureRandom random, byte[] data, int start, int end)
      throws GeneralSecurityException {
    byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
    random.nextBytes(iv);
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
    byte[] ciphertext = cipher.doFinal(data, start, end - start);
    byte[] wire = new byte[iv.length + ciphertext.length];
    System.arraycopy(iv, 0, wire, 0, iv.length);
    System.arraycopy(ciphertext, 0, wire, iv.length, ciphertext.length);
    return wire;
  }

  private static String post(
      HttpClient client, String url, String token, String contentType, byte[] body)
      throws IOException, InterruptedException {
    HttpRequest request =
        HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(30))
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", contentType)
            .POST(HttpRequest.BodyPublishers.ofByteArray(body))
            .build();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() / 100 != 2) {
      throw new IllegalStateException(
          "POST " + url + " failed: HTTP " + response.statusCode() + " " + response.body());
    }
    return response.body();
  }

  private static String jsonEscape(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  private static String trimTrailingSlash(String url) {
    return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
  }

  private static String envOrDefault(String name, String fallback) {
    String value = System.getenv(name);
    return (value == null || value.isBlank()) ? fallback : value;
  }

  private static void printUsage() {
    System.err.println("Usage: java ChunkedUploadCli.java <file> [--base-url URL] [--token TOKEN]");
    System.err.println();
    System.err.println("  --base-url   API base URL (default $WORKFLOW_API_BASE_URL or http://localhost:8080)");
    System.err.println("  --token      Bearer access token (default $WORKFLOW_ACCESS_TOKEN)");
  }
}
