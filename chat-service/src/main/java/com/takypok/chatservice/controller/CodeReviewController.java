package com.takypok.chatservice.controller;

import com.takypok.chatservice.model.CodeReviewResponse;
import com.takypok.chatservice.service.CodeReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/** Takes a raw `git diff` as the request body and reviews it against the anti-pattern rule set. */
@RestController
@RequestMapping("/code-review")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.rag.enabled", havingValue = "true", matchIfMissing = false)
public class CodeReviewController {

  private final CodeReviewService codeReviewService;

  @PostMapping(consumes = MediaType.TEXT_PLAIN_VALUE)
  public Mono<ResponseEntity<CodeReviewResponse>> review(@RequestBody String diffText) {
    return codeReviewService.review(diffText).map(ResponseEntity::ok);
  }
}
