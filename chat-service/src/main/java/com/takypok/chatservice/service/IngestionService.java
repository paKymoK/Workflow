package com.takypok.chatservice.service;

import com.takypok.chatservice.model.IngestRequest;
import com.takypok.chatservice.model.IngestResponse;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Points.Filter;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.rag.enabled", havingValue = "true", matchIfMissing = false)
public class IngestionService {

  private final VectorStore vectorStore;
  private final QdrantClient qdrantClient;
  private final FilterExpressionBuilder filterBuilder = new FilterExpressionBuilder();

  @Value("${spring.ai.vectorstore.qdrant.collection-name}")
  private String collectionName;

  @Value("${spring.ai.vectorstore.qdrant.host}")
  private String qdrantHost;

  @Value("${spring.ai.vectorstore.qdrant.port}")
  private int qdrantPort;

  @Value("${spring.ai.ollama.base-url}")
  private String ollamaBaseUrl;

  @Value("${spring.ai.ollama.embedding.model}")
  private String embeddingModel;

  @Value("${ingest.python.bin:python3}")
  private String pythonBin;

  @Value("${ingest.python.script:scripts/ingest.py}")
  private String pythonScript;

  private final TokenTextSplitter splitter =
      TokenTextSplitter.builder()
          .withChunkSize(400)
          .withMinChunkSizeChars(60)
          .withMinChunkLengthToEmbed(5)
          .withMaxNumChunks(10000)
          .withKeepSeparator(true)
          .build();

  // ── Supported by Python ──────────────────────────────────────────────────
  private static final Set<String> PYTHON_EXTENSIONS = Set.of(".docx", ".xlsx", ".pptx");
  private static final Set<String> JAVA_EXTENSIONS = Set.of(".pdf", ".txt", ".md");

  // Bucket for files sitting directly under documents/ with no application subfolder.
  private static final String UNCATEGORIZED = "uncategorized";

  /**
   * Ingests, in order of precedence: a single file (incremental — replaces just that file's
   * vectors), an entire application's folder (wipe-and-reload of just that application), or, when
   * neither is given, the whole documents folder (full wipe-and-reload of every application).
   */
  public Mono<IngestResponse> ingest(IngestRequest request) {
    String targetFileName =
        request == null ? null : StringUtils.trimWhitespace(request.getFileName());
    String application =
        request == null ? null : StringUtils.trimWhitespace(request.getApplication());

    if (StringUtils.hasText(targetFileName)) {
      return ingestSingleFile(targetFileName, application);
    }
    if (StringUtils.hasText(application)) {
      return ingestApplicationFolder(application);
    }
    return ingestFolder();
  }

  /** Lists the applications available to choose from — the top-level folders under documents/. */
  public Mono<List<String>> listApplications() {
    return Mono.fromCallable(
            () -> {
              File[] dirs = documentsRoot().listFiles(File::isDirectory);
              if (dirs == null) {
                return List.<String>of();
              }
              return Arrays.stream(dirs).map(File::getName).sorted().toList();
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private Mono<IngestResponse> ingestFolder() {
    return Mono.fromCallable(
            () -> {
              nukeCollection();
              File root = documentsRoot();
              return walkAndIngest(root, root);
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private Mono<IngestResponse> ingestApplicationFolder(String application) {
    return Mono.fromCallable(
            () -> {
              File root = documentsRoot();
              File appDir = new File(root, application);
              if (!appDir.isDirectory()) {
                return IngestResponse.builder()
                    .ingested(List.of())
                    .duplicates(List.of())
                    .failed(List.of(application))
                    .chunkCounts(Map.of())
                    .errors(Map.of(application, "Application folder not found: " + application))
                    .build();
              }

              deleteByApplication(application);
              return walkAndIngest(root, appDir);
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private IngestResponse walkAndIngest(File root, File startDir) throws IOException {
    List<String> ingested = new ArrayList<>();
    List<String> duplicates = new ArrayList<>();
    List<String> failed = new ArrayList<>();
    Map<String, Integer> chunkCounts = new HashMap<>();
    Map<String, String> errors = new HashMap<>();
    Set<String> seenKeys = new HashSet<>();

    try (Stream<Path> paths = Files.walk(startDir.toPath())) {
      paths
          .filter(Files::isRegularFile)
          .forEach(
              path -> {
                String fileName = path.getFileName().toString();
                String application = resolveApplication(root, path);
                String key = application + "/" + fileName;

                if (!seenKeys.add(key)) {
                  log.warn("Duplicate file skipped: {}", key);
                  duplicates.add(key);
                  return;
                }

                try {
                  int chunks = ingestFile(path.toFile(), application);
                  ingested.add(key);
                  chunkCounts.put(key, chunks);
                } catch (Exception e) {
                  log.error("Failed to ingest {}: {}", key, e.getMessage());
                  failed.add(key);
                  errors.put(key, e.getMessage());
                }
              });
    }

    return IngestResponse.builder()
        .ingested(ingested)
        .duplicates(duplicates)
        .failed(failed)
        .chunkCounts(chunkCounts)
        .errors(errors)
        .build();
  }

  private Mono<IngestResponse> ingestSingleFile(
      String targetFileName, String requestedApplication) {
    return Mono.fromCallable(
            () -> {
              File root = documentsRoot();
              File searchRoot =
                  StringUtils.hasText(requestedApplication)
                      ? new File(root, requestedApplication)
                      : root;

              if (!searchRoot.isDirectory()) {
                return IngestResponse.builder()
                    .ingested(List.of())
                    .duplicates(List.of())
                    .failed(List.of(targetFileName))
                    .chunkCounts(Map.of())
                    .errors(
                        Map.of(
                            targetFileName,
                            "Application folder not found: " + requestedApplication))
                    .build();
              }

              Optional<Path> match;
              try (Stream<Path> paths = Files.walk(searchRoot.toPath())) {
                match =
                    paths
                        .filter(Files::isRegularFile)
                        .filter(path -> path.getFileName().toString().equals(targetFileName))
                        .findFirst();
              }

              if (match.isEmpty()) {
                return IngestResponse.builder()
                    .ingested(List.of())
                    .duplicates(List.of())
                    .failed(List.of(targetFileName))
                    .chunkCounts(Map.of())
                    .errors(Map.of(targetFileName, "File not found in documents folder"))
                    .build();
              }

              String application = resolveApplication(root, match.get());
              String key = application + "/" + targetFileName;

              // Replace semantics: drop any vectors previously ingested for this file before
              // re-adding, so re-ingesting a single file stays idempotent without a full wipe.
              deleteBySource(targetFileName, application);

              try {
                int chunks = ingestFile(match.get().toFile(), application);
                return IngestResponse.builder()
                    .ingested(List.of(key))
                    .duplicates(List.of())
                    .failed(List.of())
                    .chunkCounts(Map.of(key, chunks))
                    .errors(Map.of())
                    .build();
              } catch (Exception e) {
                log.error("Failed to ingest {}: {}", key, e.getMessage());
                return IngestResponse.builder()
                    .ingested(List.of())
                    .duplicates(List.of())
                    .failed(List.of(key))
                    .chunkCounts(Map.of())
                    .errors(Map.of(key, e.getMessage()))
                    .build();
              }
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  /**
   * application = the top-level folder a file lives under; UNCATEGORIZED if directly in documents/.
   */
  private String resolveApplication(File root, Path filePath) {
    Path relative = root.toPath().relativize(filePath);
    return relative.getNameCount() > 1 ? relative.getName(0).toString() : UNCATEGORIZED;
  }

  private File documentsRoot() throws IOException {
    return new ClassPathResource("documents").getFile();
  }

  private void deleteBySource(String fileName, String application) {
    try {
      vectorStore.delete(
          filterBuilder
              .and(
                  filterBuilder.eq("source", fileName),
                  filterBuilder.eq("application", application))
              .build());
      log.info("Cleared existing vectors for {}/{}", application, fileName);
    } catch (Exception e) {
      log.warn("No existing vectors to clear for {}/{}: {}", application, fileName, e.getMessage());
    }
  }

  private void deleteByApplication(String application) {
    try {
      vectorStore.delete(filterBuilder.eq("application", application).build());
      log.info("Cleared existing vectors for application: {}", application);
    } catch (Exception e) {
      log.warn("No existing vectors to clear for application {}: {}", application, e.getMessage());
    }
  }

  private void nukeCollection() {
    try {
      qdrantClient.deleteAsync(collectionName, Filter.getDefaultInstance()).get();
      log.info("Cleared all vectors from collection: {}", collectionName);
    } catch (Exception e) {
      log.error("Failed to clear collection: {}", e.getMessage());
    }
  }

  private int ingestFile(File file, String application) throws IOException, InterruptedException {
    String ext = getExtension(file.getName());

    if (PYTHON_EXTENSIONS.contains(ext)) {
      return ingestViaPython(file, application);
    } else if (JAVA_EXTENSIONS.contains(ext)) {
      return ingestViaJava(file, application);
    } else {
      log.warn("Skipping unsupported file type: {}", file.getName());
      throw new IllegalArgumentException("Unsupported file type: " + ext);
    }
  }

  // ── Python path: docx / xlsx / pptx ─────────────────────────────────────
  private int ingestViaPython(File file, String application)
      throws IOException, InterruptedException {
    log.info("Delegating to Python: {}/{}", application, file.getName());

    ProcessBuilder pb = new ProcessBuilder(pythonBin, pythonScript, file.getAbsolutePath());
    pb.redirectErrorStream(false);

    // Pass required env vars to the Python process
    Map<String, String> env = pb.environment();
    env.put("QDRANT_URL", "http://" + qdrantHost + ":" + qdrantPort);
    env.put("QDRANT_COLLECTION", collectionName);
    env.put("OLLAMA_BASE_URL", ollamaBaseUrl);
    env.put("EMBEDDING_MODEL", embeddingModel);
    env.put("DOCUMENT_APPLICATION", application);

    Process process = pb.start();
    String stdout = new String(process.getInputStream().readAllBytes());
    String stderr = new String(process.getErrorStream().readAllBytes());
    int exitCode = process.waitFor();

    if (exitCode != 0) {
      throw new RuntimeException("Python ingest failed for " + file.getName() + ": " + stderr);
    }

    return parseChunkCount(stdout.trim(), file.getName());
  }

  // stdout format: "OK:{chunks}:{filename}"
  private int parseChunkCount(String stdout, String fileName) {
    String[] parts = stdout.split(":", 3);
    if (parts.length < 2 || !"OK".equals(parts[0])) {
      log.warn("Unexpected Python ingest output for {}: {}", fileName, stdout);
      return 0;
    }
    try {
      return Integer.parseInt(parts[1].trim());
    } catch (NumberFormatException e) {
      log.warn("Could not parse chunk count from Python output for {}: {}", fileName, stdout);
      return 0;
    }
  }

  // ── Java path: pdf / txt / md ────────────────────────────────────────────
  private int ingestViaJava(File file, String application) throws IOException {
    log.info("Ingesting via Java: {}/{}", application, file.getName());
    List<Document> docs;

    if (file.getName().endsWith(".pdf")) {
      docs = new PagePdfDocumentReader("file:" + file.getAbsolutePath()).get();
    } else {
      String content = Files.readString(file.toPath());
      docs = List.of(new Document(content, Map.of("source", file.getName())));
    }

    docs.forEach(
        d -> {
          d.getMetadata().put("source", file.getName());
          d.getMetadata().put("application", application);
        });
    List<Document> chunks = splitter.apply(docs);
    vectorStore.add(chunks);
    log.info("Added {} chunks from {}/{}", chunks.size(), application, file.getName());
    return chunks.size();
  }

  private String getExtension(String filename) {
    int dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
  }
}
