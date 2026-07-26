package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.DocumentPost;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DocumentPostRepository extends R2dbcRepository<DocumentPost, Long> {

  @Query(
      """
      SELECT * FROM document_post
      WHERE (:category IS NULL OR category = :category)
        AND (:status IS NULL OR status = :status)
      ORDER BY created_at DESC
      LIMIT :size OFFSET :offset
      """)
  Flux<DocumentPost> feed(String category, String status, int size, long offset);

  @Query(
      """
      SELECT COUNT(*) FROM document_post
      WHERE (:category IS NULL OR category = :category)
        AND (:status IS NULL OR status = :status)
      """)
  Mono<Long> countFeed(String category, String status);
}
