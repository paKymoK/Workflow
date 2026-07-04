package com.takypok.chatservice.repository;

import com.takypok.chatservice.model.entity.Conversation;
import java.time.ZonedDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
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

  @Query(
      """
      SELECT c.* FROM conversation c
      JOIN conversation_participant cp ON cp.conversation_id = c.id
      WHERE cp.participant_sub = :sub
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
      LIMIT :pageLimit
      """)
  Flux<Conversation> findPageForParticipant(String sub, int pageLimit);

  @Query(
      """
      SELECT c.* FROM conversation c
      JOIN conversation_participant cp ON cp.conversation_id = c.id
      WHERE cp.participant_sub = :sub
        AND (COALESCE(c.last_message_at, c.created_at), c.id) < (:before, :beforeId)
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
      LIMIT :pageLimit
      """)
  Flux<Conversation> findPageForParticipantBefore(
      String sub, ZonedDateTime before, UUID beforeId, int pageLimit);

  @Query(
      "UPDATE conversation SET last_message_at = :lastMessageAt, last_message_id = :lastMessageId"
          + " WHERE id = :conversationId")
  Mono<Integer> updateLastMessage(
      UUID conversationId, Long lastMessageId, ZonedDateTime lastMessageAt);
}
