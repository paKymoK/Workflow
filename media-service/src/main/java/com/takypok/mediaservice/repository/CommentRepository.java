package com.takypok.mediaservice.repository;

import com.takypok.mediaservice.model.entity.Comment;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface CommentRepository extends R2dbcRepository<Comment, UUID> {}
