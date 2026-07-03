package com.takypok.workflowservice.service;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Comment;
import com.takypok.workflowservice.model.request.CommentRequest;
import java.util.List;
import java.util.UUID;
import reactor.core.publisher.Mono;

public interface CommentService {
  Mono<List<Comment>> get(Long ticketId);

  Mono<Comment> comment(Long ticketId, CommentRequest request, User user);

  Mono<Comment> update(Long ticketId, UUID id, String content, User user);
}
