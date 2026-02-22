package com.takypok.mediaservice.service;

import com.takypok.mediaservice.model.request.CommentRequest;
import reactor.core.publisher.Mono;

public interface CommentService {
  Mono<String> comment(CommentRequest request);
}
