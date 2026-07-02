package com.takypok.chatservice.chat.service;

import com.takypok.chatservice.chat.model.entity.Conversation;
import com.takypok.chatservice.chat.model.request.CreateConversationRequest;
import com.takypok.chatservice.chat.model.response.ConversationSummaryResponse;
import com.takypok.core.model.authentication.User;
import java.util.List;
import java.util.UUID;
import reactor.core.publisher.Mono;

public interface ConversationService {

  Mono<Conversation> createConversation(CreateConversationRequest request, User caller);

  Mono<List<ConversationSummaryResponse>> listMyConversations(String callerSub);

  Mono<Conversation> rename(UUID conversationId, String name, String callerSub);

  Mono<Void> addParticipants(UUID conversationId, List<String> participantSubs, String callerSub);

  Mono<Void> removeParticipant(UUID conversationId, String targetSub, String callerSub);

  Mono<Void> markRead(UUID conversationId, String callerSub);

  /** Errors with {@link IllegalStateException} when {@code sub} is not in the conversation. */
  Mono<Void> assertParticipant(UUID conversationId, String sub);
}
