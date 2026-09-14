package com.takypok.mediaservice.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.takypok.core.exception.ApplicationException;
import com.takypok.mediaservice.config.ChunkedUploadProperties;
import com.takypok.mediaservice.config.StorageProperties;
import com.takypok.mediaservice.model.dto.FinishChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadResponse;
import com.takypok.mediaservice.model.entity.UploadFile;
import com.takypok.mediaservice.model.mapper.UploadFileMapper;
import com.takypok.mediaservice.repository.UploadFileRepository;
import com.takypok.mediaservice.service.UploadSessionRegistry;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

class ChunkedUploadServiceImplTest {

  @TempDir Path tempDir;

  private static final DefaultDataBufferFactory BUFFERS = new DefaultDataBufferFactory();

  private ChunkedUploadServiceImpl service;
  private ChunkedUploadProperties properties;
  private UploadFileRepository uploadFileRepository;

  @BeforeEach
  void setUp() {
    StorageProperties storageProperties = new StorageProperties();
    storageProperties.setFilesDir(tempDir.toString());

    properties = new ChunkedUploadProperties();
    properties.setChunkSizeBytes(8);
    properties.setMaxTotalSizeBytes(1_000_000);
    properties.setMaxActiveSessions(50);

    UploadSessionRegistry registry = new UploadSessionRegistry(storageProperties, properties);

    UploadFileMapper mapper = mock(UploadFileMapper.class);
    when(mapper.mapToEntity(anyString(), anyString()))
        .thenAnswer(
            inv -> {
              UploadFile file = new UploadFile();
              file.setName(inv.getArgument(0));
              file.setExtension(inv.getArgument(1));
              return file;
            });

    uploadFileRepository = mock(UploadFileRepository.class);
    when(uploadFileRepository.save(any(UploadFile.class)))
        .thenAnswer(
            inv -> {
              UploadFile file = inv.getArgument(0);
              file.setId(UUID.randomUUID());
              return Mono.just(file);
            });

    service =
        new ChunkedUploadServiceImpl(
            registry, properties, storageProperties, uploadFileRepository, mapper);
  }

  private String startSession(long totalSize) {
    StartChunkedUploadResponse response =
        service
            .start(
                new StartChunkedUploadRequest(UUID.randomUUID().toString(), "test.txt", totalSize))
            .block();
    assertThat(response.chunkSizeBytes()).isEqualTo(8);
    return response.sessionId();
  }

  private void writeChunk(String sessionId, int index, byte[] bytes) {
    service.writeChunk(sessionId, index, Flux.just(buffer(bytes))).block();
  }

  private static DataBuffer buffer(byte[] bytes) {
    return BUFFERS.wrap(bytes);
  }

  @Test
  void happyPath_assemblesFileByteIdentical() throws Exception {
    byte[] data = "ABCDEFGHIJKLMNOPQRST".getBytes(StandardCharsets.UTF_8); // 20 bytes, chunkSize=8
    String sessionId = startSession(data.length);

    writeChunk(sessionId, 0, sliceOf(data, 0, 8));
    writeChunk(sessionId, 1, sliceOf(data, 8, 16));
    writeChunk(sessionId, 2, sliceOf(data, 16, 20));

    UploadFile result = service.finish(sessionId, new FinishChunkedUploadRequest(3)).block();

    assertThat(result.getId()).isNotNull();
    byte[] written = Files.readAllBytes(tempDir.resolve(result.getId() + ".txt"));
    assertThat(written).isEqualTo(data);
  }

  @Test
  void listFiles_returnsFinishedFilesButNotInProgressSessions() throws Exception {
    byte[] data = "ABCDEFGH".getBytes(StandardCharsets.UTF_8); // exactly one chunk
    String finishedSessionId = startSession(data.length);
    writeChunk(finishedSessionId, 0, data);
    UploadFile finished =
        service.finish(finishedSessionId, new FinishChunkedUploadRequest(1)).block();

    // A second session left mid-upload: its ".part" file must not show up as an uploaded file.
    String inProgressSessionId = startSession(data.length);
    writeChunk(inProgressSessionId, 0, data);

    List<com.takypok.mediaservice.model.dto.ChunkedUploadedFile> files =
        service.listFiles().block();

    assertThat(files).hasSize(1);
    assertThat(files.get(0).name()).isEqualTo(finished.getId() + ".txt");
    assertThat(files.get(0).sizeBytes()).isEqualTo(data.length);
  }

  @Test
  void outOfOrderConcurrentChunks_stillAssembleCorrectly() throws Exception {
    byte[] data = "ABCDEFGHIJKLMNOPQRST".getBytes(StandardCharsets.UTF_8);
    String sessionId = startSession(data.length);

    List<Integer> indexes = List.of(2, 0, 1); // deliberately out of order
    Flux.fromIterable(indexes)
        .flatMap(
            index -> {
              byte[] chunk =
                  index == 2 ? sliceOf(data, 16, 20) : sliceOf(data, index * 8, index * 8 + 8);
              return service.writeChunk(sessionId, index, Flux.just(buffer(chunk)));
            })
        .blockLast();

    UploadFile result = service.finish(sessionId, new FinishChunkedUploadRequest(3)).block();

    byte[] written = Files.readAllBytes(tempDir.resolve(result.getId() + ".txt"));
    assertThat(written).isEqualTo(data);
  }

  @Test
  void duplicateChunk_isIdempotent() throws Exception {
    byte[] data = "ABCDEFGH".getBytes(StandardCharsets.UTF_8); // exactly one chunk
    String sessionId = startSession(data.length);

    writeChunk(sessionId, 0, data);
    writeChunk(sessionId, 0, data); // retry of the same chunk

    UploadFile result = service.finish(sessionId, new FinishChunkedUploadRequest(1)).block();

    byte[] written = Files.readAllBytes(tempDir.resolve(result.getId() + ".txt"));
    assertThat(written).isEqualTo(data);
  }

  @Test
  void finish_rejectsWhenAChunkIsMissing() {
    byte[] data = "ABCDEFGHIJKLMNOPQRST".getBytes(StandardCharsets.UTF_8);
    String sessionId = startSession(data.length);

    writeChunk(sessionId, 0, sliceOf(data, 0, 8));
    // chunk 1 deliberately skipped
    writeChunk(sessionId, 2, sliceOf(data, 16, 20));

    assertThatThrownBy(() -> service.finish(sessionId, new FinishChunkedUploadRequest(3)).block())
        .isInstanceOf(ApplicationException.class);
  }

  @Test
  void writeChunk_rejectsUnknownSessionId() {
    assertThatThrownBy(
            () ->
                service.writeChunk(
                    UUID.randomUUID().toString(), 0, Flux.just(buffer("x".getBytes()))))
        .isInstanceOf(ApplicationException.class);
  }

  @Test
  void writeChunk_rejectsOversizedChunk() {
    String sessionId = startSession(100);
    byte[] tooBig = "ABCDEFGHI".getBytes(StandardCharsets.UTF_8); // 9 bytes > chunkSizeBytes(8)

    assertThatThrownBy(() -> service.writeChunk(sessionId, 0, Flux.just(buffer(tooBig))).block())
        .isInstanceOf(ApplicationException.class);
  }

  @Test
  void writeChunk_rejectsOnceTotalSizeCapExceeded() {
    properties.setMaxTotalSizeBytes(10); // smaller than two 8-byte chunks combined
    String sessionId = startSession(16);

    writeChunk(sessionId, 0, "ABCDEFGH".getBytes(StandardCharsets.UTF_8));

    assertThatThrownBy(
            () ->
                service
                    .writeChunk(
                        sessionId,
                        1,
                        Flux.just(buffer("IJKLMNOP".getBytes(StandardCharsets.UTF_8))))
                    .block())
        .isInstanceOf(ApplicationException.class);
  }

  @Test
  void start_rejectsPathTraversalSessionId() {
    StartChunkedUploadRequest request =
        new StartChunkedUploadRequest("../../etc/passwd", "f.txt", 1L);

    assertThatThrownBy(() -> service.start(request).block())
        .isInstanceOf(ApplicationException.class);
  }

  private static byte[] sliceOf(byte[] data, int from, int to) {
    return java.util.Arrays.copyOfRange(data, from, to);
  }
}
