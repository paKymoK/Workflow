package com.takypok.workflowservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Comment;
import com.takypok.workflowservice.model.mapper.CommentMapper;
import com.takypok.workflowservice.model.request.CommentRequest;
import com.takypok.workflowservice.repository.CommentRepository;
import com.takypok.workflowservice.service.CommentService;
import java.util.List;
import java.util.UUID;
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
    return commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId).collectList();
  }

  @Override
  public Mono<Comment> comment(Long ticketId, CommentRequest request, User user) {
    Comment comment = commentMapper.mapToEntity(request, ticketId, user);
    comment.setMentionedSubs(parseMentions(request.getContent()));
    return commentRepository.save(comment);
  }

  @Override
  public Mono<Comment> update(Long ticketId, UUID id, String content, User user) {
    return commentRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Comment not found")))
        .flatMap(
            comment -> {
              if (!comment.getTicketId().equals(ticketId)) {
                return Mono.error(
                    new ApplicationException(Message.Application.ERROR, "Comment not found"));
              }
              if (!comment.getCommenter().getSub().equals(user.getSub())) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "You are not allowed to edit this comment"));
              }
              comment.setContent(content);
              comment.setIsEdited(true);
              comment.setMentionedSubs(parseMentions(content));
              return commentRepository.save(comment);
            });
  }

  private String[] parseMentions(String content) {
    Matcher matcher = MENTION_PATTERN.matcher(content);
    return matcher.results().map(r -> r.group(1)).toArray(String[]::new);
  }
}
