package com.takypok.mediaservice.controller;

import static com.takypok.core.util.AuthenticationUtil.getUserInfo;

import com.takypok.mediaservice.model.entity.Comment;
import com.takypok.mediaservice.model.request.CommentRequest;
import com.takypok.mediaservice.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/comment")
public class CommentController {
  private final CommentService commentService;

  @PostMapping("")
  public Mono<Comment> comment(@RequestBody @Valid CommentRequest request, Authentication authentication) {
    return commentService.comment(request, getUserInfo(authentication));
  }
}
