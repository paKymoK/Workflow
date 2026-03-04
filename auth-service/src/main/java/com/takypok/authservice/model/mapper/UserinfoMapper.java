package com.takypok.authservice.model.mapper;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.model.response.UserinfoResponse;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserinfoMapper {
  @Mapping(target = "sub", source = "sub")
  Userinfo toEntity(Userinfo userinfo, String sub);

  UserinfoResponse toResponse(Userinfo user);

  List<UserinfoResponse> toListResponse(List<Userinfo> users);
}
