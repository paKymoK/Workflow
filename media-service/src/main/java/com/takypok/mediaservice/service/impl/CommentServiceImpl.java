package com.takypok.mediaservice.service.impl;

import com.takypok.core.model.authentication.User;
import com.takypok.mediaservice.model.entity.Comment;
import com.takypok.mediaservice.model.mapper.CommentMapper;
import com.takypok.mediaservice.model.request.CommentRequest;
import com.takypok.mediaservice.repository.CommentRepository;
import com.takypok.mediaservice.service.CommentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {
  private final CommentRepository commentRepository;
  private final CommentMapper commentMapper;

  @Override
  public Mono<List<Comment>> get(Long ticketId) {
    return commentRepository.findByTicketId(ticketId).collectList();
  }

  @Override
  public Mono<Comment> comment(CommentRequest request, User user) {

    return commentRepository.save(commentMapper.mapToEntity(request, user));
  }
}
