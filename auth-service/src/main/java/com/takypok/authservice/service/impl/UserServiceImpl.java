package com.takypok.authservice.service.impl;

import com.takypok.authservice.model.mapper.UserinfoMapper;
import com.takypok.authservice.model.request.UserinfoRequest;
import com.takypok.authservice.model.response.UserinfoResponse;
import com.takypok.authservice.repository.UserInfoRepository;
import com.takypok.authservice.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
  private final UserInfoRepository userInfoRepository;
  private final UserinfoMapper userinfoMapper;

  @Override
  public List<UserinfoResponse> getUsers() {
    return userinfoMapper.toListResponse(userInfoRepository.findAll());
  }

  @Override
  public UserinfoResponse getUserById(String sub) {
    return userinfoMapper.toResponse(userInfoRepository.getReferenceById(sub));
  }

  @Override
  public UserinfoResponse create(UserinfoRequest request) {
    return null;
  }
}
