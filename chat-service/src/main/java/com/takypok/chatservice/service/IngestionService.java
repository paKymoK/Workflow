package com.takypok.chatservice.service;

import java.io.File;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionService {

  private final VectorStore vectorStore;

  // Tuned for Vietnamese — shorter chunks, moderate overlap
  private final TokenTextSplitter splitter = new TokenTextSplitter(400, 60, 5, 10000, true);

  public void ingestFolder(String folderPath) {
    File folder = new File(folderPath);
    File[] files = folder.listFiles();
    if (files == null) {
      log.warn("No files found in {}", folderPath);
      return;
    }

    for (File file : files) {
      try {
        ingestFile(file);
      } catch (Exception e) {
        log.error("Failed to ingest {}: {}", file.getName(), e.getMessage());
      }
    }
  }

  private void ingestFile(File file) {
    log.info("Ingesting: {}", file.getName());
    List<Document> docs;

    if (file.getName().endsWith(".pdf")) {
      var reader = new PagePdfDocumentReader("file:" + file.getAbsolutePath());
      docs = reader.get();
    } else {
      // Plain text / markdown — read manually
      try {
        String content =
            new String(
                java.nio.file.Files.readAllBytes(file.toPath()),
                java.nio.charset.StandardCharsets.UTF_8);
        docs = List.of(new Document(content, Map.of("source", file.getName())));
      } catch (Exception e) {
        log.error("Cannot read {}", file.getName());
        return;
      }
    }

    // Tag each chunk with source filename
    docs.forEach(d -> d.getMetadata().put("source", file.getName()));

    List<Document> chunks = splitter.apply(docs);
    vectorStore.add(chunks);
    log.info("Added {} chunks from {}", chunks.size(), file.getName());
  }
}
