package com.takypok.chatservice.repository;

import com.takypok.chatservice.model.entity.Message;
import java.time.ZonedDateTime;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface MessageRepository extends R2dbcRepository<Message, Long> {

  Flux<Message> findByConversationIdOrderByIdDesc(UUID conversationId, Pageable pageable);

  Flux<Message> findByConversationIdAndIdLessThanOrderByIdDesc(
      UUID conversationId, Long beforeId, Pageable pageable);

  Mono<Message> findFirstByConversationIdOrderByIdDesc(UUID conversationId);

  Mono<Long> countByConversationIdAndCreatedAtAfter(UUID conversationId, ZonedDateTime after);
}
