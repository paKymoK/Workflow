package com.takypok.employeeservice.controller;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.Roles;
import com.takypok.core.util.AuthenticationUtil;
import com.takypok.employeeservice.model.request.CreateNewsCommentRequest;
import com.takypok.employeeservice.model.request.CreateNewsPostRequest;
import com.takypok.employeeservice.model.request.FilterNewsRequest;
import com.takypok.employeeservice.model.request.PinNewsPostRequest;
import com.takypok.employeeservice.model.request.ToggleReactionRequest;
import com.takypok.employeeservice.model.request.UpdateNewsCommentRequest;
import com.takypok.employeeservice.model.request.UpdateNewsPostRequest;
import com.takypok.employeeservice.model.response.NewsCommentResponse;
import com.takypok.employeeservice.model.response.NewsPostResponse;
import com.takypok.employeeservice.service.NewsService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * An employee-generated feed, not an official-announcements-only channel: any authenticated
 * employee may create/edit/comment/react. ADMIN's only extra power is moderation (deleting someone
 * else's post/comment and pinning) — never editing someone else's content.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/news")
public class NewsController {
  private final NewsService newsService;

  @GetMapping
  public Mono<ResultMessage<PageResponse<NewsPostResponse>>> list(
      @Valid FilterNewsRequest request, Authentication authentication) {
    return newsService.list(request, authentication.getName()).map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<NewsPostResponse>> getById(
      @PathVariable Long id, Authentication authentication) {
    return newsService.getById(id, authentication.getName()).map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<NewsPostResponse>> create(
      @RequestBody @Valid CreateNewsPostRequest request, Authentication authentication) {
    return newsService.create(request, authentication.getName()).map(ResultMessage::success);
  }

  @PutMapping("/{id}")
  public Mono<ResultMessage<NewsPostResponse>> update(
      @PathVariable Long id,
      @RequestBody @Valid UpdateNewsPostRequest request,
      Authentication authentication) {
    return newsService.update(id, request, authentication.getName()).map(ResultMessage::success);
  }

  @PatchMapping("/{id}/pin")
  public Mono<ResultMessage<NewsPostResponse>> setPinned(
      @PathVariable Long id,
      @RequestBody @Valid PinNewsPostRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(newsService.setPinned(id, request.getPinned(), authentication.getName()))
        .map(ResultMessage::success);
  }

  @DeleteMapping("/{id}")
  public Mono<ResultMessage<Void>> delete(@PathVariable Long id, Authentication authentication) {
    return newsService
        .delete(id, authentication.getName(), isAdmin(authentication))
        .thenReturn(ResultMessage.success(null));
  }

  @PostMapping("/{id}/reactions")
  public Mono<ResultMessage<NewsPostResponse>> toggleReaction(
      @PathVariable Long id,
      @RequestBody @Valid ToggleReactionRequest request,
      Authentication authentication) {
    return newsService
        .toggleReaction(id, request.getEmoji(), authentication.getName())
        .map(ResultMessage::success);
  }

  @GetMapping("/{id}/comments")
  public Mono<ResultMessage<List<NewsCommentResponse>>> getComments(
      @PathVariable Long id, Authentication authentication) {
    return newsService.getComments(id, authentication.getName()).map(ResultMessage::success);
  }

  @PostMapping("/{id}/comments")
  public Mono<ResultMessage<NewsCommentResponse>> addComment(
      @PathVariable Long id,
      @RequestBody @Valid CreateNewsCommentRequest request,
      Authentication authentication) {
    return newsService
        .addComment(id, request, authentication.getName())
        .map(ResultMessage::success);
  }

  @PutMapping("/comments/{commentId}")
  public Mono<ResultMessage<NewsCommentResponse>> updateComment(
      @PathVariable Long commentId,
      @RequestBody @Valid UpdateNewsCommentRequest request,
      Authentication authentication) {
    return newsService
        .updateComment(commentId, request, authentication.getName())
        .map(ResultMessage::success);
  }

  @DeleteMapping("/comments/{commentId}")
  public Mono<ResultMessage<Void>> deleteComment(
      @PathVariable Long commentId, Authentication authentication) {
    return newsService
        .deleteComment(commentId, authentication.getName(), isAdmin(authentication))
        .thenReturn(ResultMessage.success(null));
  }

  @PostMapping("/comments/{commentId}/like")
  public Mono<ResultMessage<NewsCommentResponse>> toggleCommentLike(
      @PathVariable Long commentId, Authentication authentication) {
    return newsService
        .toggleCommentLike(commentId, authentication.getName())
        .map(ResultMessage::success);
  }

  private boolean isAdmin(Authentication authentication) {
    return AuthenticationUtil.getRoles(authentication).contains(Roles.ADMIN);
  }

  /** Pinning is a moderation/highlight action — admin-only, unlike edit which is owner-only. */
  private Mono<Void> requireAdmin(Authentication authentication) {
    if (isAdmin(authentication)) {
      return Mono.empty();
    }
    return Mono.error(new ApplicationException(Message.Application.ERROR, "Admin role required"));
  }
}
