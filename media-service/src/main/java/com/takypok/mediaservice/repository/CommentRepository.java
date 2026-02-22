package com.takypok.mediaservice.repository;

import com.takypok.mediaservice.model.entity.Comment;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface CommentRepository extends R2dbcRepository<Comment, UUID> {
  Flux<Comment> findByTicketId(Long ticketId);
}
