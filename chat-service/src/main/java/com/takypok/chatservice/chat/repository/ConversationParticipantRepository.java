package com.takypok.chatservice.chat.repository;

import com.takypok.chatservice.chat.model.entity.ConversationParticipant;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ConversationParticipantRepository
    extends R2dbcRepository<ConversationParticipant, UUID> {

  Flux<ConversationParticipant> findByConversationId(UUID conversationId);

  Mono<ConversationParticipant> findByConversationIdAndParticipantSub(
      UUID conversationId, String participantSub);

  Flux<ConversationParticipant> findByParticipantSub(String participantSub);

  Mono<Void> deleteByConversationIdAndParticipantSub(UUID conversationId, String participantSub);
}
