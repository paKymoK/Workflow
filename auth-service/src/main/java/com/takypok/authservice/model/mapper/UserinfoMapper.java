package com.takypok.authservice.model.mapper;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.model.response.UserinfoResponse;
import com.takypok.core.model.PageResponse;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.data.domain.Page;

@Mapper(componentModel = "spring")
public interface UserinfoMapper {
  @Mapping(target = "sub", source = "sub")
  Userinfo toEntity(Userinfo userinfo, String sub);

  UserinfoResponse toResponse(Userinfo user);

  default PageResponse<UserinfoResponse> toPageResponse(Page<Userinfo> users) {
    return PageResponse.<UserinfoResponse>builder()
        .content(users.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
        .page(users.getNumber()) // current page number (0-indexed)
        .size(users.getSize()) // page size
        .totalElements(users.getTotalElements())
        .totalPages(users.getTotalPages())
        .build();
  }
}
