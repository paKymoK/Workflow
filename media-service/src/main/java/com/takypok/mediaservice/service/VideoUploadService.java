package com.takypok.mediaservice.service;

import java.nio.file.StandardOpenOption;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class VideoUploadService {

  private final VideoStorageService storageService;

  public Mono<Void> save(Flux<DataBuffer> data, String videoId) {
    return DataBufferUtils.write(
        data,
        storageService.rawPath(videoId),
        StandardOpenOption.CREATE,
        StandardOpenOption.TRUNCATE_EXISTING);
  }
}
