package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.ContentStatus;
import com.takypok.employeeservice.model.entity.NewsComment;
import java.util.Collection;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface NewsCommentRepository extends R2dbcRepository<NewsComment, Long> {

  Flux<NewsComment> findByPostIdAndStatusOrderByCreatedAt(Long postId, ContentStatus status);

  Flux<NewsComment> findByPostIdInAndStatus(Collection<Long> postIds, ContentStatus status);
}
