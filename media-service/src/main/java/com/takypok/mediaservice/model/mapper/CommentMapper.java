package com.takypok.mediaservice.model.mapper;

import com.takypok.core.model.authentication.User;
import com.takypok.mediaservice.model.entity.Comment;
import com.takypok.mediaservice.model.request.CommentRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class CommentMapper {
  @Mapping(target = "id", expression = "java(null)")
  public abstract Comment mapToEntity(CommentRequest request, User commenter);
}
