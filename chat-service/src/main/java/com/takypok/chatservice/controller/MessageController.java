package com.takypok.chatservice.controller;

import static com.takypok.core.util.AuthenticationUtil.getUserInfo;

import com.takypok.chatservice.model.entity.Message;
import com.takypok.chatservice.model.request.SendMessageRequest;
import com.takypok.chatservice.service.MessageService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/conversations/{conversationId}/messages")
public class MessageController {
  private final MessageService messageService;

  @PostMapping
  public Mono<Message> send(
      @PathVariable UUID conversationId,
      @RequestBody SendMessageRequest request,
      Authentication authentication) {
    return messageService.sendMessage(conversationId, request, getUserInfo(authentication));
  }

  @GetMapping
  public Mono<List<Message>> list(
      @PathVariable UUID conversationId,
      @RequestParam(required = false) Long before,
      @RequestParam(defaultValue = "50") int size,
      Authentication authentication) {
    return messageService.listMessages(
        conversationId, before, size, getUserInfo(authentication).getSub());
  }
}
