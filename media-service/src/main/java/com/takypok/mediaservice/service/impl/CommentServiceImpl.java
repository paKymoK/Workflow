package com.takypok.mediaservice.service.impl;

import com.takypok.mediaservice.model.request.CommentRequest;
import com.takypok.mediaservice.service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {
  @Override
  public Mono<String> comment(CommentRequest request) {
    return null;
  }
}
