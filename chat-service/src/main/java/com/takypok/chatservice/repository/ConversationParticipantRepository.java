package com.takypok.chatservice.repository;

import com.takypok.chatservice.model.entity.ConversationParticipant;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ConversationParticipantRepository
    extends R2dbcRepository<ConversationParticipant, UUID> {

  Flux<ConversationParticipant> findByConversationId(UUID conversationId);

  Flux<ConversationParticipant> findByConversationIdIn(Collection<UUID> conversationIds);

  Mono<ConversationParticipant> findByConversationIdAndParticipantSub(
      UUID conversationId, String participantSub);

  Flux<ConversationParticipant> findByParticipantSub(String participantSub);

  Mono<Void> deleteByConversationIdAndParticipantSub(UUID conversationId, String participantSub);

  // GREATEST guards against this ever regressing if the send-time (presence-based) and
  // fetch-time (reconnect catch-up) delivery paths race each other.
  @Query(
      """
      UPDATE conversation_participant
      SET delivered_through_message_id = GREATEST(COALESCE(delivered_through_message_id, 0), :messageId)
      WHERE conversation_id = :conversationId AND participant_sub = :sub
      """)
  Mono<Integer> bumpDeliveredThrough(UUID conversationId, String sub, Long messageId);
}
