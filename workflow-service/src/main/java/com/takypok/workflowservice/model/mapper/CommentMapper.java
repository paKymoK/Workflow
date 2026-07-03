package com.takypok.workflowservice.model.mapper;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.Comment;
import com.takypok.workflowservice.model.request.CommentRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class CommentMapper {
  @Mapping(target = "id", expression = "java(null)")
  @Mapping(target = "mentionedSubs", ignore = true)
  public abstract Comment mapToEntity(CommentRequest request, Long ticketId, User commenter);
}
