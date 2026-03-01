package com.takypok.authservice.service;

import com.takypok.authservice.model.Userinfo;
import java.util.List;

public interface UserService {
  List<Userinfo> getUsers();

  Userinfo getUserById(Long id);
}
