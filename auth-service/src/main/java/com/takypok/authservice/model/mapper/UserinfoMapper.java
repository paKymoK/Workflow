package com.takypok.authservice.model.mapper;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.model.response.UserinfoResponse;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserinfoMapper {
  UserinfoResponse toResponse(Userinfo user);

  List<UserinfoResponse> toListResponse(List<Userinfo> users);
}
