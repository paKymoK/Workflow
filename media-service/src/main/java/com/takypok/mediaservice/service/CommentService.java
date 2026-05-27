package com.takypok.mediaservice.service;

import com.takypok.core.model.authentication.User;
import com.takypok.mediaservice.model.entity.Comment;
import com.takypok.mediaservice.model.request.CommentRequest;
import java.util.List;
import java.util.UUID;
import reactor.core.publisher.Mono;

public interface CommentService {
  Mono<List<Comment>> get(Long ticketId);

  Mono<Comment> comment(CommentRequest request, User user);

  Mono<Comment> update(UUID id, String content, User user);
}
