package com.takypok.chatservice.chat.service.impl;

import com.takypok.chatservice.chat.model.entity.ConversationParticipant;
import com.takypok.chatservice.chat.model.entity.Message;
import com.takypok.chatservice.chat.model.event.ChatEvent;
import com.takypok.chatservice.chat.model.request.SendMessageRequest;
import com.takypok.chatservice.chat.repository.ConversationParticipantRepository;
import com.takypok.chatservice.chat.repository.MessageRepository;
import com.takypok.chatservice.chat.service.ChatSessionRegistry;
import com.takypok.chatservice.chat.service.ConversationService;
import com.takypok.chatservice.chat.service.MessageService;
import com.takypok.core.model.authentication.User;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {
  private static final int MAX_PAGE_SIZE = 100;

  private final MessageRepository messageRepository;
  private final ConversationParticipantRepository participantRepository;
  private final ConversationService conversationService;
  private final ChatSessionRegistry sessionRegistry;

  @Override
  public Mono<Message> sendMessage(UUID conversationId, SendMessageRequest request, User sender) {
    return conversationService
        .assertParticipant(conversationId, sender.getSub())
        .then(
            Mono.defer(
                () -> {
                  Message message = new Message();
                  message.setConversationId(conversationId);
                  message.setSender(sender);
                  message.setContent(request.getContent());
                  message.setMessageType(request.getMessageType());
                  message.setAttachments(request.getAttachments());
                  return messageRepository.save(message);
                }))
        .doOnSuccess(this::broadcastMessage);
  }

  @Override
  public Mono<List<Message>> listMessages(
      UUID conversationId, Long beforeId, int size, String callerSub) {
    int pageSize = Math.min(size <= 0 ? 50 : size, MAX_PAGE_SIZE);
    PageRequest pageRequest = PageRequest.of(0, pageSize);

    return conversationService
        .assertParticipant(conversationId, callerSub)
        .then(
            Mono.defer(
                () ->
                    (beforeId == null
                            ? messageRepository.findByConversationIdOrderByIdDesc(
                                conversationId, pageRequest)
                            : messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(
                                conversationId, beforeId, pageRequest))
                        .collectList()));
  }

  private void broadcastMessage(Message message) {
    participantRepository
        .findByConversationId(message.getConversationId())
        .map(ConversationParticipant::getParticipantSub)
        .collectList()
        .subscribe(
            subs ->
                sessionRegistry.broadcast(
                    subs,
                    new ChatEvent(
                        ChatEvent.ChatEventType.MESSAGE_CREATED,
                        Map.of("conversationId", message.getConversationId(), "message", message))),
            error -> log.error("Failed to broadcast new message: {}", error.getMessage(), error));
  }
}
