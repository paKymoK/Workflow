package com.takypok.mediaservice.service;

import com.takypok.core.model.authentication.User;
import com.takypok.mediaservice.model.entity.Comment;
import com.takypok.mediaservice.model.request.CommentRequest;
import reactor.core.publisher.Mono;

public interface CommentService {
  Mono<Comment> comment(CommentRequest request, User user);
}
