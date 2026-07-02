package com.takypok.chatservice.repository;

import com.takypok.chatservice.model.entity.Conversation;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Mono;

public interface ConversationRepository extends R2dbcRepository<Conversation, UUID> {

  @Query(
      """
      SELECT c.* FROM conversation c
      WHERE c.type = 'DIRECT'
        AND c.id IN (SELECT conversation_id FROM conversation_participant WHERE participant_sub = :subA)
        AND c.id IN (SELECT conversation_id FROM conversation_participant WHERE participant_sub = :subB)
        AND (SELECT COUNT(*) FROM conversation_participant cp WHERE cp.conversation_id = c.id) = 2
      LIMIT 1
      """)
  Mono<Conversation> findExistingDirectConversation(String subA, String subB);
}
