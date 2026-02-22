package com.takypok.mediaservice.service.impl;

import static com.takypok.mediaservice.util.FileUtil.getFileExtension;

import com.takypok.mediaservice.model.entity.UploadFile;
import com.takypok.mediaservice.model.mapper.UploadFileMapper;
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
  private final UploadFileMapper uploadFileMapper;

  @Override
  public Mono<UploadFile> upload(FilePart filePart) {
    String filename = filePart.filename();
    String extension = getFileExtension(filename);
    return uploadFileRepository
        .save(uploadFileMapper.mapToEntity(filename, extension))
        .flatMap(
            uploadFile ->
                filePart
                    .transferTo(new File("uploads/images/" + uploadFile.getId() + extension))
                    .thenReturn(uploadFile));
  }
}
