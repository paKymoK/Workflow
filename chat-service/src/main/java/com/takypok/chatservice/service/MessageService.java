package com.takypok.chatservice.service;

import com.takypok.chatservice.model.entity.Message;
import com.takypok.chatservice.model.request.SendMessageRequest;
import com.takypok.core.model.authentication.User;
import java.util.List;
import java.util.UUID;
import reactor.core.publisher.Mono;

public interface MessageService {

  Mono<Message> sendMessage(UUID conversationId, SendMessageRequest request, User sender);

  Mono<List<Message>> listMessages(UUID conversationId, Long beforeId, int size, String callerSub);
}
