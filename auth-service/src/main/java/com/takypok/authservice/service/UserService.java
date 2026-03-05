package com.takypok.authservice.service;

import com.takypok.authservice.model.request.FilterUserRequest;
import com.takypok.authservice.model.request.UserinfoRequest;
import com.takypok.authservice.model.response.UserinfoResponse;
import com.takypok.core.model.PageResponse;

public interface UserService {
  PageResponse<UserinfoResponse> getUsers(FilterUserRequest request);

  UserinfoResponse getUserById(String sub);

  UserinfoResponse create(UserinfoRequest request);
}
