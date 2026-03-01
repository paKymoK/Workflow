package com.takypok.authservice.service.impl;

import com.takypok.authservice.model.Userinfo;
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

  @Override
  public List<Userinfo> getUsers() {
    return userInfoRepository.findAll();
  }

  @Override
  public Userinfo getUserById(Long id) {
    return userInfoRepository.getReferenceById(String.valueOf(id));
  }
}
