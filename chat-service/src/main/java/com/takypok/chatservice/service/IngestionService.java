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

  /**
   * Ingests either a single file (incremental — replaces just that file's vectors) or, when no
   * fileName is given, the whole documents folder (full wipe-and-reload, unchanged behavior).
   */
  public Mono<IngestResponse> ingest(IngestRequest request) {
    String targetFileName =
        request == null ? null : StringUtils.trimWhitespace(request.getFileName());

    if (StringUtils.hasText(targetFileName)) {
      return ingestSingleFile(targetFileName);
    }
    return ingestFolder();
  }

  private Mono<IngestResponse> ingestFolder() {
    return Mono.fromCallable(
            () -> {
              nukeCollection();

              File folder = new ClassPathResource("documents").getFile();

              List<String> ingested = new ArrayList<>();
              List<String> duplicates = new ArrayList<>();
              List<String> failed = new ArrayList<>();
              Map<String, Integer> chunkCounts = new HashMap<>();
              Map<String, String> errors = new HashMap<>();
              Set<String> seenNames = new HashSet<>();

              try (Stream<Path> paths = Files.walk(folder.toPath())) {
                paths
                    .filter(Files::isRegularFile)
                    .forEach(
                        path -> {
                          String fileName = path.getFileName().toString();

                          if (!seenNames.add(fileName)) {
                            log.warn("Duplicate filename skipped: {}", fileName);
                            duplicates.add(fileName);
                            return;
                          }

                          try {
                            int chunks = ingestFile(path.toFile());
                            ingested.add(fileName);
                            chunkCounts.put(fileName, chunks);
                          } catch (Exception e) {
                            log.error("Failed to ingest {}: {}", fileName, e.getMessage());
                            failed.add(fileName);
                            errors.put(fileName, e.getMessage());
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
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private Mono<IngestResponse> ingestSingleFile(String targetFileName) {
    return Mono.fromCallable(
            () -> {
              File folder = new ClassPathResource("documents").getFile();

              Optional<Path> match;
              try (Stream<Path> paths = Files.walk(folder.toPath())) {
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

              // Replace semantics: drop any vectors previously ingested for this file before
              // re-adding, so re-ingesting a single file stays idempotent without a full wipe.
              deleteBySource(targetFileName);

              try {
                int chunks = ingestFile(match.get().toFile());
                return IngestResponse.builder()
                    .ingested(List.of(targetFileName))
                    .duplicates(List.of())
                    .failed(List.of())
                    .chunkCounts(Map.of(targetFileName, chunks))
                    .errors(Map.of())
                    .build();
              } catch (Exception e) {
                log.error("Failed to ingest {}: {}", targetFileName, e.getMessage());
                return IngestResponse.builder()
                    .ingested(List.of())
                    .duplicates(List.of())
                    .failed(List.of(targetFileName))
                    .chunkCounts(Map.of())
                    .errors(Map.of(targetFileName, e.getMessage()))
                    .build();
              }
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private void deleteBySource(String fileName) {
    try {
      vectorStore.delete(filterBuilder.eq("source", fileName).build());
      log.info("Cleared existing vectors for source: {}", fileName);
    } catch (Exception e) {
      log.warn("No existing vectors to clear for source {}: {}", fileName, e.getMessage());
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

  private int ingestFile(File file) throws IOException, InterruptedException {
    String ext = getExtension(file.getName());

    if (PYTHON_EXTENSIONS.contains(ext)) {
      return ingestViaPython(file);
    } else if (JAVA_EXTENSIONS.contains(ext)) {
      return ingestViaJava(file);
    } else {
      log.warn("Skipping unsupported file type: {}", file.getName());
      throw new IllegalArgumentException("Unsupported file type: " + ext);
    }
  }

  // ── Python path: docx / xlsx / pptx ─────────────────────────────────────
  private int ingestViaPython(File file) throws IOException, InterruptedException {
    log.info("Delegating to Python: {}", file.getName());

    ProcessBuilder pb = new ProcessBuilder(pythonBin, pythonScript, file.getAbsolutePath());
    pb.redirectErrorStream(false);

    // Pass required env vars to the Python process
    Map<String, String> env = pb.environment();
    env.put("QDRANT_URL", "http://" + qdrantHost + ":" + qdrantPort);
    env.put("QDRANT_COLLECTION", collectionName);
    env.put("OLLAMA_BASE_URL", ollamaBaseUrl);
    env.put("EMBEDDING_MODEL", embeddingModel);

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
  private int ingestViaJava(File file) throws IOException {
    log.info("Ingesting via Java: {}", file.getName());
    List<Document> docs;

    if (file.getName().endsWith(".pdf")) {
      docs = new PagePdfDocumentReader("file:" + file.getAbsolutePath()).get();
    } else {
      String content = Files.readString(file.toPath());
      docs = List.of(new Document(content, Map.of("source", file.getName())));
    }

    docs.forEach(d -> d.getMetadata().put("source", file.getName()));
    List<Document> chunks = splitter.apply(docs);
    vectorStore.add(chunks);
    log.info("Added {} chunks from {}", chunks.size(), file.getName());
    return chunks.size();
  }

  private String getExtension(String filename) {
    int dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
  }
}
