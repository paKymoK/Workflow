package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.NewsPost;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NewsPostRepository extends R2dbcRepository<NewsPost, Long> {

  @Query(
      """
      SELECT * FROM news_post
      WHERE status = 'PUBLISHED'
        AND (:type IS NULL OR type = :type)
      ORDER BY pinned DESC, created_at DESC
      LIMIT :size OFFSET :offset
      """)
  Flux<NewsPost> feed(String type, int size, long offset);

  @Query(
      """
      SELECT COUNT(*) FROM news_post
      WHERE status = 'PUBLISHED'
        AND (:type IS NULL OR type = :type)
      """)
  Mono<Long> countFeed(String type);
}
