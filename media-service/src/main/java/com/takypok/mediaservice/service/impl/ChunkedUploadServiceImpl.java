package com.takypok.mediaservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.mediaservice.config.ChunkedUploadProperties;
import com.takypok.mediaservice.config.StorageProperties;
import com.takypok.mediaservice.model.UploadSession;
import com.takypok.mediaservice.model.dto.ChunkAckResponse;
import com.takypok.mediaservice.model.dto.FinishChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadResponse;
import com.takypok.mediaservice.model.entity.UploadFile;
import com.takypok.mediaservice.model.mapper.UploadFileMapper;
import com.takypok.mediaservice.repository.UploadFileRepository;
import com.takypok.mediaservice.service.ChunkedUploadService;
import com.takypok.mediaservice.service.UploadSessionRegistry;
import com.takypok.mediaservice.util.UploadSizeLimiter;
import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousFileChannel;
import java.nio.channels.CompletionHandler;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChunkedUploadServiceImpl implements ChunkedUploadService {
  private final UploadSessionRegistry registry;
  private final ChunkedUploadProperties properties;
  private final StorageProperties storageProperties;
  private final UploadFileRepository uploadFileRepository;
  private final UploadFileMapper uploadFileMapper;

  @Override
  public Mono<StartChunkedUploadResponse> start(StartChunkedUploadRequest request) {
    if (request.filename() == null || request.filename().isBlank()) {
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "filename is required"));
    }
    return registry
        .getOrCreate(request)
        .map(
            session ->
                new StartChunkedUploadResponse(
                    session.getSessionId(),
                    properties.getChunkSizeBytes(),
                    properties.getSessionIdleTimeoutSeconds()));
  }

  @Override
  public Mono<ChunkAckResponse> writeChunk(String sessionId, int index, Flux<DataBuffer> body) {
    UploadSession session = registry.require(sessionId);
    if (session.getFinishing().get()) {
      return Mono.error(
          new ApplicationException(
              Message.Application.ERROR,
              "Upload session is finalizing; cannot accept more chunks"));
    }
    if (index < 0) {
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "Chunk index must not be negative"));
    }
    return DataBufferUtils.join(body, (int) properties.getChunkSizeBytes())
        .onErrorMap(
            DataBufferLimitException.class,
            e ->
                new ApplicationException(
                    Message.Application.ERROR,
                    "Chunk exceeds maximum allowed size of "
                        + (properties.getChunkSizeBytes() / 1024)
                        + "KB"))
        .flatMap(buffer -> writeToChannel(session, index, buffer));
  }

  private Mono<ChunkAckResponse> writeToChannel(
      UploadSession session, int index, DataBuffer buffer) {
    int byteCount = buffer.readableByteCount();
    if (byteCount == 0) {
      DataBufferUtils.release(buffer);
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "Chunk must not be empty"));
    }
    try {
      UploadSizeLimiter.checkWithinLimit(
          session.getTotalBytesReceived().sum(),
          byteCount,
          properties.getMaxTotalSizeBytes(),
          "Upload");
    } catch (ApplicationException e) {
      DataBufferUtils.release(buffer);
      return Mono.error(e);
    }
    long position = (long) index * properties.getChunkSizeBytes();
    ByteBuffer byteBuffer = buffer.asByteBuffer();
    return writeAsync(session.getChannel(), byteBuffer, position)
        .doFinally(signal -> DataBufferUtils.release(buffer))
        .map(
            written -> {
              session.getChunkLengths().put(index, byteCount);
              session.getReceivedIndexes().add(index);
              session.getTotalBytesReceived().add(byteCount);
              session.touch();
              long totalSoFar = session.getTotalBytesReceived().sum();
              log.debug(
                  "Session {} chunk {} written ({} bytes, total {} bytes so far)",
                  session.getSessionId(),
                  index,
                  byteCount,
                  totalSoFar);
              return new ChunkAckResponse(index, byteCount, totalSoFar);
            });
  }

  private Mono<Integer> writeAsync(
      AsynchronousFileChannel channel, ByteBuffer buffer, long position) {
    return Mono.create(
        sink ->
            channel.write(
                buffer,
                position,
                null,
                new CompletionHandler<Integer, Void>() {
                  @Override
                  public void completed(Integer result, Void attachment) {
                    sink.success(result);
                  }

                  @Override
                  public void failed(Throwable exc, Void attachment) {
                    sink.error(exc);
                  }
                }));
  }

  @Override
  public Mono<UploadFile> finish(String sessionId, FinishChunkedUploadRequest request) {
    UploadSession session = registry.require(sessionId);
    if (!session.getFinishing().compareAndSet(false, true)) {
      return Mono.error(
          new ApplicationException(
              Message.Application.ERROR, "Finish already requested for this session"));
    }
    int totalChunks = request.totalChunks();
    if (totalChunks <= 0) {
      return Mono.error(
          new ApplicationException(Message.Application.ERROR, "totalChunks must be positive"));
    }
    if (session.getReceivedIndexes().size() != totalChunks
        || session.getReceivedIndexes().first() != 0
        || session.getReceivedIndexes().last() != totalChunks - 1) {
      return Mono.error(
          new ApplicationException(
              Message.Application.ERROR,
              "Upload incomplete: expected "
                  + totalChunks
                  + " chunks, received "
                  + session.getReceivedIndexes().size()));
    }

    long chunkSizeBytes = properties.getChunkSizeBytes();
    long total = 0;
    for (int i = 0; i < totalChunks; i++) {
      int len = session.getChunkLengths().getOrDefault(i, 0);
      boolean isLast = i == totalChunks - 1;
      if (!isLast && len != chunkSizeBytes) {
        return Mono.error(
            new ApplicationException(
                Message.Application.ERROR,
                "Chunk "
                    + i
                    + " has an unexpected size; only the final chunk may be shorter than "
                    + chunkSizeBytes
                    + " bytes"));
      }
      if (isLast && (len <= 0 || len > chunkSizeBytes)) {
        return Mono.error(
            new ApplicationException(Message.Application.ERROR, "Final chunk has an invalid size"));
      }
      total += len;
    }
    UploadSizeLimiter.checkWithinLimit(0, total, properties.getMaxTotalSizeBytes(), "Upload");

    long finalTotal = total;
    return closeAndPersist(session)
        .doOnSuccess(
            uploadFile -> {
              registry.remove(session.getSessionId());
              log.info(
                  "Chunked upload session {} finalized -> {} ({} bytes, {} chunks)",
                  session.getSessionId(),
                  uploadFile.getId(),
                  finalTotal,
                  totalChunks);
            });
  }

  private Mono<UploadFile> closeAndPersist(UploadSession session) {
    return uploadFileRepository
        .save(uploadFileMapper.mapToEntity(session.getFilename(), session.getExtension()))
        .flatMap(
            uploadFile ->
                Mono.fromCallable(
                        () -> {
                          session.getChannel().close();
                          Path finalPath =
                              Path.of(
                                  storageProperties.getImagesDir(),
                                  uploadFile.getId() + session.getExtension());
                          Files.move(
                              session.getPartPath(),
                              finalPath,
                              StandardCopyOption.REPLACE_EXISTING);
                          return uploadFile;
                        })
                    .onErrorResume(e -> deletePartial(session.getPartPath()).then(Mono.error(e))));
  }

  private Mono<Void> deletePartial(Path path) {
    return Mono.fromRunnable(
        () -> {
          try {
            Files.deleteIfExists(path);
          } catch (Exception e) {
            log.warn("Failed to clean up partial chunked upload {}: {}", path, e.getMessage());
          }
        });
  }
}
