package com.takypok.chatservice.service;

import com.takypok.chatservice.model.IngestResponse;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Points.Filter;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionService {

  private final VectorStore vectorStore;
  private final QdrantClient qdrantClient;

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

  private final TokenTextSplitter splitter = new TokenTextSplitter(400, 60, 5, 10000, true);

  // ── Supported by Python ──────────────────────────────────────────────────
  private static final Set<String> PYTHON_EXTENSIONS = Set.of(".docx", ".xlsx", ".pptx");
  private static final Set<String> JAVA_EXTENSIONS = Set.of(".pdf", ".txt", ".md");

  public Mono<IngestResponse> ingestFolder() {
    return Mono.fromCallable(
            () -> {
              nukeCollection();

              File folder = new ClassPathResource("documents").getFile();

              List<String> ingested = new ArrayList<>();
              List<String> duplicates = new ArrayList<>();
              List<String> failed = new ArrayList<>();
              Set<String> seenNames = new HashSet<>();

              Files.walk(folder.toPath())
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
                          ingestFile(path.toFile());
                          ingested.add(fileName);
                        } catch (Exception e) {
                          log.error("Failed to ingest {}: {}", fileName, e.getMessage());
                          failed.add(fileName);
                        }
                      });

              return IngestResponse.builder()
                  .ingested(ingested)
                  .duplicates(duplicates)
                  .failed(failed)
                  .build();
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  private void nukeCollection() {
    try {
      qdrantClient.deleteAsync(collectionName, Filter.getDefaultInstance()).get();
      log.info("Cleared all vectors from collection: {}", collectionName);
    } catch (Exception e) {
      log.error("Failed to clear collection: {}", e.getMessage());
    }
  }

  private void ingestFile(File file) throws IOException, InterruptedException {
    String ext = getExtension(file.getName());

    if (PYTHON_EXTENSIONS.contains(ext)) {
      ingestViaPython(file);
    } else if (JAVA_EXTENSIONS.contains(ext)) {
      ingestViaJava(file);
    } else {
      log.warn("Skipping unsupported file type: {}", file.getName());
    }
  }

  // ── Python path: docx / xlsx / pptx ─────────────────────────────────────
  private void ingestViaPython(File file) throws IOException, InterruptedException {
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

    // stdout format: "OK:{chunks}:{filename}"
    log.info("Python ingest result: {}", stdout.trim());
  }

  // ── Java path: pdf / txt / md ────────────────────────────────────────────
  private void ingestViaJava(File file) throws IOException {
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
  }

  private String getExtension(String filename) {
    int dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
  }
}
