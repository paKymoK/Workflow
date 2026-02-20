package com.takypok.mediaservice.service.impl;

import static com.takypok.mediaservice.util.FileUtil.getFileExtension;

import com.takypok.mediaservice.model.UploadFile;
import com.takypok.mediaservice.repository.UploadFileRepository;
import com.takypok.mediaservice.service.UploadFileService;
import java.io.File;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class UploadFileServiceImpl implements UploadFileService {
  private final UploadFileRepository uploadFileRepository;

  @Override
  public Mono<String> upload(FilePart filePart) {
    String filename = filePart.filename();
    String extension = getFileExtension(filename);
    return uploadFileRepository
        .save(new UploadFile(filename))
        .flatMap(
            uploadFile ->
                filePart
                    .transferTo(new File("uploads/" + uploadFile.getId() + extension))
                    .thenReturn("File uploaded: " + filename));
  }
}
