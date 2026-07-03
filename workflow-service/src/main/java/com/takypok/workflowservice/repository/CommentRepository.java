package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Comment;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface CommentRepository extends R2dbcRepository<Comment, UUID> {
  Flux<Comment> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
}
