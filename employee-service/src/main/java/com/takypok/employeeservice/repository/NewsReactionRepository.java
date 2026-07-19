package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.NewsReaction;
import java.util.Collection;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NewsReactionRepository extends R2dbcRepository<NewsReaction, Long> {

  Mono<NewsReaction> findByPostIdAndParticipantSub(Long postId, String participantSub);

  Flux<NewsReaction> findByPostIdIn(Collection<Long> postIds);
}
