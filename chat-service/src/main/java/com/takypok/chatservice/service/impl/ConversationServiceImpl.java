package com.takypok.chatservice.service.impl;

import com.takypok.chatservice.model.ConversationType;
import com.takypok.chatservice.model.ParticipantRole;
import com.takypok.chatservice.model.entity.Conversation;
import com.takypok.chatservice.model.entity.ConversationParticipant;
import com.takypok.chatservice.model.entity.Message;
import com.takypok.chatservice.model.event.ChatEvent;
import com.takypok.chatservice.model.request.CreateConversationRequest;
import com.takypok.chatservice.model.response.ConversationSummaryResponse;
import com.takypok.chatservice.repository.ConversationParticipantRepository;
import com.takypok.chatservice.repository.ConversationRepository;
import com.takypok.chatservice.repository.MessageRepository;
import com.takypok.chatservice.service.ChatSessionRegistry;
import com.takypok.chatservice.service.ConversationService;
import com.takypok.core.model.authentication.User;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationServiceImpl implements ConversationService {
  private static final ZonedDateTime EPOCH =
      ZonedDateTime.ofInstant(java.time.Instant.EPOCH, ZoneOffset.UTC);

  private final ConversationRepository conversationRepository;
  private final ConversationParticipantRepository participantRepository;
  private final MessageRepository messageRepository;
  private final ChatSessionRegistry sessionRegistry;

  @Override
  public Mono<Conversation> createConversation(CreateConversationRequest request, User caller) {
    if (request.getType() == ConversationType.GROUP
        && (request.getName() == null || request.getName().isBlank())) {
      return Mono.error(new IllegalStateException("A group conversation requires a name"));
    }

    if (request.getType() == ConversationType.DIRECT) {
      if (request.getParticipantSubs().size() != 1) {
        return Mono.error(
            new IllegalStateException(
                "A direct conversation requires exactly one other participant"));
      }
      String otherSub = request.getParticipantSubs().get(0);
      return conversationRepository
          .findExistingDirectConversation(caller.getSub(), otherSub)
          .switchIfEmpty(Mono.defer(() -> createNewConversation(request, caller)));
    }

    return createNewConversation(request, caller);
  }

  private Mono<Conversation> createNewConversation(CreateConversationRequest request, User caller) {
    Conversation conversation = new Conversation();
    conversation.setType(request.getType());
    conversation.setName(request.getType() == ConversationType.GROUP ? request.getName() : null);

    return conversationRepository
        .save(conversation)
        .flatMap(
            saved -> {
              List<String> subs = new ArrayList<>(request.getParticipantSubs());
              subs.add(caller.getSub());
              List<ConversationParticipant> participants =
                  subs.stream()
                      .distinct()
                      .map(sub -> newParticipant(saved.getId(), sub, sub.equals(caller.getSub())))
                      .toList();
              return participantRepository.saveAll(participants).then(Mono.just(saved));
            });
  }

  private ConversationParticipant newParticipant(UUID conversationId, String sub, boolean isOwner) {
    ConversationParticipant participant = new ConversationParticipant();
    participant.setConversationId(conversationId);
    participant.setParticipantSub(sub);
    participant.setRole(isOwner ? ParticipantRole.OWNER : ParticipantRole.MEMBER);
    participant.setJoinedAt(ZonedDateTime.now());
    return participant;
  }

  @Override
  public Mono<List<ConversationSummaryResponse>> listMyConversations(String callerSub) {
    return participantRepository
        .findByParticipantSub(callerSub)
        .flatMap(this::buildSummary)
        .collectList();
  }

  private Mono<ConversationSummaryResponse> buildSummary(ConversationParticipant myParticipant) {
    UUID conversationId = myParticipant.getConversationId();
    ZonedDateTime since =
        myParticipant.getLastReadAt() != null ? myParticipant.getLastReadAt() : EPOCH;

    Mono<Conversation> conversationMono = conversationRepository.findById(conversationId);
    Mono<List<String>> subsMono =
        participantRepository
            .findByConversationId(conversationId)
            .map(ConversationParticipant::getParticipantSub)
            .collectList();
    Mono<Optional<Message>> lastMessageMono =
        messageRepository
            .findFirstByConversationIdOrderByIdDesc(conversationId)
            .map(Optional::of)
            .defaultIfEmpty(Optional.empty());
    Mono<Long> unreadCountMono =
        messageRepository.countByConversationIdAndCreatedAtAfter(conversationId, since);

    return Mono.zip(conversationMono, subsMono, lastMessageMono, unreadCountMono)
        .map(
            tuple ->
                new ConversationSummaryResponse(
                    conversationId,
                    tuple.getT1().getType(),
                    tuple.getT1().getName(),
                    tuple.getT2(),
                    tuple.getT3().orElse(null),
                    tuple.getT4()));
  }

  @Override
  public Mono<Conversation> rename(UUID conversationId, String name, String callerSub) {
    return requireOwner(conversationId, callerSub)
        .then(conversationRepository.findById(conversationId))
        .switchIfEmpty(Mono.error(new IllegalStateException("Conversation not found")))
        .flatMap(
            conversation -> {
              conversation.setName(name);
              return conversationRepository.save(conversation);
            })
        .doOnSuccess(
            conversation ->
                notifyParticipants(
                    conversationId,
                    ChatEvent.ChatEventType.CONVERSATION_RENAMED,
                    Map.of("conversationId", conversationId, "name", name)));
  }

  @Override
  public Mono<Void> addParticipants(
      UUID conversationId, List<String> participantSubs, String callerSub) {
    List<String> subs = participantSubs.stream().distinct().toList();
    return requireOwner(conversationId, callerSub)
        .thenMany(Flux.fromIterable(subs))
        .flatMap(
            sub ->
                participantRepository
                    .findByConversationIdAndParticipantSub(conversationId, sub)
                    .switchIfEmpty(
                        Mono.defer(
                            () ->
                                participantRepository.save(
                                    newParticipant(conversationId, sub, false)))))
        .then()
        .doOnSuccess(
            v ->
                notifyParticipants(
                    conversationId,
                    ChatEvent.ChatEventType.PARTICIPANT_ADDED,
                    Map.of("conversationId", conversationId, "participantSubs", subs)));
  }

  @Override
  public Mono<Void> removeParticipant(UUID conversationId, String targetSub, String callerSub) {
    Mono<Void> authorized =
        callerSub.equals(targetSub) ? Mono.empty() : requireOwner(conversationId, callerSub);

    return authorized
        .then(
            participantRepository.deleteByConversationIdAndParticipantSub(
                conversationId, targetSub))
        .doOnSuccess(
            v ->
                notifyParticipants(
                    conversationId,
                    ChatEvent.ChatEventType.PARTICIPANT_REMOVED,
                    Map.of("conversationId", conversationId, "participantSub", targetSub)));
  }

  @Override
  public Mono<Void> markRead(UUID conversationId, String callerSub) {
    return participantRepository
        .findByConversationIdAndParticipantSub(conversationId, callerSub)
        .switchIfEmpty(
            Mono.error(new IllegalStateException("Not a participant of this conversation")))
        .flatMap(
            participant -> {
              participant.setLastReadAt(ZonedDateTime.now());
              return participantRepository.save(participant);
            })
        .then();
  }

  @Override
  public Mono<Void> assertParticipant(UUID conversationId, String sub) {
    return participantRepository
        .findByConversationIdAndParticipantSub(conversationId, sub)
        .switchIfEmpty(
            Mono.error(new IllegalStateException("Not a participant of this conversation")))
        .then();
  }

  private Mono<Void> requireOwner(UUID conversationId, String sub) {
    return participantRepository
        .findByConversationIdAndParticipantSub(conversationId, sub)
        .switchIfEmpty(
            Mono.error(new IllegalStateException("Not a participant of this conversation")))
        .flatMap(
            participant ->
                participant.getRole() == ParticipantRole.OWNER
                    ? Mono.<Void>empty()
                    : Mono.error(
                        new IllegalStateException("Only the owner can perform this action")));
  }

  private void notifyParticipants(
      UUID conversationId, ChatEvent.ChatEventType type, Object payload) {
    participantRepository
        .findByConversationId(conversationId)
        .map(ConversationParticipant::getParticipantSub)
        .collectList()
        .subscribe(
            subs -> sessionRegistry.broadcast(subs, new ChatEvent(type, payload)),
            error ->
                log.error(
                    "Failed to broadcast chat event {}: {}", type, error.getMessage(), error));
  }
}
