package com.takypok.mediaservice.service;

import com.takypok.mediaservice.model.dto.Base64ChunkRequest;
import com.takypok.mediaservice.model.dto.ChunkAckResponse;
import com.takypok.mediaservice.model.dto.ChunkedUploadedFile;
import com.takypok.mediaservice.model.dto.FinishChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadRequest;
import com.takypok.mediaservice.model.dto.StartChunkedUploadResponse;
import com.takypok.mediaservice.model.entity.UploadFile;
import java.util.List;
import org.springframework.core.io.buffer.DataBuffer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ChunkedUploadService {
  Mono<StartChunkedUploadResponse> start(StartChunkedUploadRequest request);

  Mono<ChunkAckResponse> writeChunk(String sessionId, int index, Flux<DataBuffer> body);

  /**
   * Same as {@link #writeChunk}, but takes the chunk as a base64-encoded string in a JSON body
   * instead of a raw binary stream. Some corporate proxies/gateways content-inspect raw
   * octet-stream bodies and block ones that look like a recognizable binary format (e.g. the ZIP
   * signature at the start of an .xlsx/.docx) — base64 text sidesteps that.
   */
  Mono<ChunkAckResponse> writeChunkBase64(String sessionId, int index, Base64ChunkRequest request);

  Mono<UploadFile> finish(String sessionId, FinishChunkedUploadRequest request);

  Mono<List<ChunkedUploadedFile>> listFiles();
}
