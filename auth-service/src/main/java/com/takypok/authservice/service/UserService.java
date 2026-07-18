package com.takypok.authservice.service;

import com.takypok.authservice.model.request.CreateUserRequest;

public interface UserService {
  void create(CreateUserRequest request);
}
