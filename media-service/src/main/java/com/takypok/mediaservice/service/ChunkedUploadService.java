package com.takypok.mediaservice.service;

import com.takypok.mediaservice.model.dto.ChunkAckResponse;
import com.takypok.mediaservice.model.dto.FinishChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadResponse;
import com.takypok.mediaservice.model.entity.UploadFile;
import org.springframework.core.io.buffer.DataBuffer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ChunkedUploadService {
  Mono<StartChunkedUploadResponse> start(StartChunkedUploadRequest request);

  Mono<ChunkAckResponse> writeChunk(String sessionId, int index, Flux<DataBuffer> body);

  Mono<UploadFile> finish(String sessionId, FinishChunkedUploadRequest request);
}
