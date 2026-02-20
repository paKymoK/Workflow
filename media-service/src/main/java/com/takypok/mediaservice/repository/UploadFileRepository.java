package com.takypok.mediaservice.repository;

import com.takypok.mediaservice.model.UploadFile;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UploadFileRepository extends R2dbcRepository<UploadFile, UUID> {
  @Query(
      """
                  SELECT * FROM upload_file
                  WHERE id = :id
                  """)
  Mono<UploadFile> findById(@NonNull UUID id);
}
