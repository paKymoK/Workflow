package com.takypok.mediaservice.service.impl;

import com.takypok.core.model.authentication.User;
import com.takypok.mediaservice.model.entity.Comment;
import com.takypok.mediaservice.model.mapper.CommentMapper;
import com.takypok.mediaservice.model.request.CommentRequest;
import com.takypok.mediaservice.repository.CommentRepository;
import com.takypok.mediaservice.service.CommentService;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {
  private static final Pattern MENTION_PATTERN = Pattern.compile("@\\{([^}]+)\\}");

  private final CommentRepository commentRepository;
  private final CommentMapper commentMapper;

  @Override
  public Mono<List<Comment>> get(Long ticketId) {
    return commentRepository.findByTicketId(ticketId).collectList();
  }

  @Override
  public Mono<Comment> comment(CommentRequest request, User user) {
    Comment comment = commentMapper.mapToEntity(request, user);
    comment.setMentionedSubs(parseMentions(request.getContent()));
    return commentRepository.save(comment);
  }

  private String[] parseMentions(String content) {
    Matcher matcher = MENTION_PATTERN.matcher(content);
    return matcher.results().map(r -> r.group(1)).toArray(String[]::new);
  }
}
