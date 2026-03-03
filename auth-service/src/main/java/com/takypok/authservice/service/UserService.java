package com.takypok.authservice.service;

import com.takypok.authservice.model.request.UserinfoRequest;
import com.takypok.authservice.model.response.UserinfoResponse;
import java.util.List;

public interface UserService {
  List<UserinfoResponse> getUsers();

  UserinfoResponse getUserById(String sub);

  UserinfoResponse create(UserinfoRequest request);
}
