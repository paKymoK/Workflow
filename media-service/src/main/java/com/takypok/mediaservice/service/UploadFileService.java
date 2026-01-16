package com.takypok.mediaservice.service;

import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

public interface UploadFileService {
  Mono<String> upload(FilePart filePart);
}
