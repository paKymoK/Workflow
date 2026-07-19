package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.NewsCommentLike;
import java.util.Collection;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NewsCommentLikeRepository extends R2dbcRepository<NewsCommentLike, Long> {

  Mono<NewsCommentLike> findByCommentIdAndParticipantSub(Long commentId, String participantSub);

  Flux<NewsCommentLike> findByCommentIdIn(Collection<Long> commentIds);
}
