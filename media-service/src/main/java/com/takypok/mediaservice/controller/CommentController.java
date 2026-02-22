package com.takypok.mediaservice.controller;

import com.takypok.mediaservice.model.request.CommentRequest;
import com.takypok.mediaservice.service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/v1/comment")
public class CommentController {
  private final CommentService commentService;

  @PostMapping("")
  public Mono<String> comment(@RequestBody CommentRequest request) {
    return commentService.comment(request);
  }
}
