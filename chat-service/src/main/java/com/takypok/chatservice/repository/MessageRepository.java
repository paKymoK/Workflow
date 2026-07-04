package com.takypok.chatservice.repository;

import com.takypok.chatservice.model.entity.Message;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface MessageRepository extends R2dbcRepository<Message, Long> {

  Flux<Message> findByConversationIdOrderByIdDesc(UUID conversationId, Pageable pageable);

  Flux<Message> findByConversationIdAndIdLessThanOrderByIdDesc(
      UUID conversationId, Long beforeId, Pageable pageable);

  Flux<Message> findByIdIn(Collection<Long> ids);

  // `query` here is a pre-built tsquery expression (e.g. "verif:* & auto:*"), assembled in
  // MessageServiceImpl.buildPrefixQuery — not raw user text. to_tsquery still only ever
  // receives it as a bound function argument, never string-concatenated, so there's no
  // injection surface even though we're constructing the expression ourselves now.
  @Query(
      """
      SELECT * FROM message
      WHERE conversation_id = :conversationId
        AND search_vector @@ to_tsquery('english', :query)
      ORDER BY id DESC
      LIMIT :limit
      """)
  Flux<Message> searchInConversation(UUID conversationId, String query, int limit);
}
