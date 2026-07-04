package com.takypok.chatservice.repository;

import com.takypok.chatservice.model.entity.Message;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface MessageRepository extends R2dbcRepository<Message, Long> {

  Flux<Message> findByConversationIdOrderByIdDesc(UUID conversationId, Pageable pageable);

  Flux<Message> findByConversationIdAndIdLessThanOrderByIdDesc(
      UUID conversationId, Long beforeId, Pageable pageable);

  Flux<Message> findByIdIn(Collection<Long> ids);
}
