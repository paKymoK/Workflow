package com.takypok.chatservice.chat.controller;

import static com.takypok.core.util.AuthenticationUtil.getUserInfo;

import com.takypok.chatservice.chat.model.entity.Conversation;
import com.takypok.chatservice.chat.model.request.AddParticipantsRequest;
import com.takypok.chatservice.chat.model.request.CreateConversationRequest;
import com.takypok.chatservice.chat.model.request.RenameConversationRequest;
import com.takypok.chatservice.chat.model.response.ConversationSummaryResponse;
import com.takypok.chatservice.chat.service.ConversationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/conversations")
public class ConversationController {
  private final ConversationService conversationService;

  @PostMapping
  public Mono<Conversation> create(
      @RequestBody @Valid CreateConversationRequest request, Authentication authentication) {
    return conversationService.createConversation(request, getUserInfo(authentication));
  }

  @GetMapping
  public Mono<List<ConversationSummaryResponse>> list(Authentication authentication) {
    return conversationService.listMyConversations(getUserInfo(authentication).getSub());
  }

  @PatchMapping("/{id}")
  public Mono<Conversation> rename(
      @PathVariable UUID id,
      @RequestBody @Valid RenameConversationRequest request,
      Authentication authentication) {
    return conversationService.rename(id, request.getName(), getUserInfo(authentication).getSub());
  }

  @PostMapping("/{id}/members")
  public Mono<Void> addMembers(
      @PathVariable UUID id,
      @RequestBody @Valid AddParticipantsRequest request,
      Authentication authentication) {
    return conversationService.addParticipants(
        id, request.getParticipantSubs(), getUserInfo(authentication).getSub());
  }

  @DeleteMapping("/{id}/members/{sub}")
  public Mono<Void> removeMember(
      @PathVariable UUID id, @PathVariable String sub, Authentication authentication) {
    return conversationService.removeParticipant(id, sub, getUserInfo(authentication).getSub());
  }

  @PostMapping("/{id}/read")
  public Mono<Void> markRead(@PathVariable UUID id, Authentication authentication) {
    return conversationService.markRead(id, getUserInfo(authentication).getSub());
  }
}
