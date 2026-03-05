package com.takypok.authservice.service.impl;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.model.mapper.UserinfoMapper;
import com.takypok.authservice.model.request.FilterUserRequest;
import com.takypok.authservice.model.request.UserinfoRequest;
import com.takypok.authservice.model.response.UserinfoResponse;
import com.takypok.authservice.repository.UserInfoRepository;
import com.takypok.authservice.service.UserService;
import com.takypok.core.model.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
  private final UserInfoRepository userInfoRepository;
  private final JdbcUserDetailsManager userDetailsManager;
  private final UserinfoMapper userinfoMapper;

  @Override
  public PageResponse<UserinfoResponse> getUsers(FilterUserRequest request) {
    Pageable pageable = PageRequest.of(request.getPage(), request.getSize());
    return userinfoMapper.toPageResponse(userInfoRepository.findAll(pageable));
  }

  @Override
  public UserinfoResponse getUserById(String sub) {
    return userinfoMapper.toResponse(userInfoRepository.getReferenceById(sub));
  }

  @Override
  @Transactional
  public UserinfoResponse create(UserinfoRequest request) {
    PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    UserDetails user =
        User.builder()
            .username(request.getUsername())
            .password(encoder.encode(request.getPassword()))
            .roles("USER")
            .build();
    userDetailsManager.createUser(user);
    Userinfo info = userinfoMapper.toEntity(request.getUserinfo(), user.getUsername());
    return userinfoMapper.toResponse(userInfoRepository.save(info));
  }
}
