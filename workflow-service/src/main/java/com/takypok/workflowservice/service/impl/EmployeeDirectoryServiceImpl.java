package com.takypok.workflowservice.service.impl;

import com.takypok.core.model.UserSummary;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.EmployeeDirectory;
import com.takypok.workflowservice.repository.EmployeeDirectoryRepository;
import com.takypok.workflowservice.service.EmployeeDirectoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class EmployeeDirectoryServiceImpl implements EmployeeDirectoryService {
  private static final int SEARCH_LIMIT = 10;

  private final EmployeeDirectoryRepository employeeDirectoryRepository;

  @Override
  public Mono<User> getUser(String sub) {
    return employeeDirectoryRepository.findById(sub).map(this::toUser);
  }

  @Override
  public Mono<List<UserSummary>> searchUsers(String q) {
    return employeeDirectoryRepository
        .search(q, SEARCH_LIMIT)
        .map(d -> new UserSummary(d.getSub(), d.getName(), d.getEmail()))
        .collectList();
  }

  @Override
  public Mono<String> getManagerSub(String sub) {
    return employeeDirectoryRepository.findById(sub).mapNotNull(EmployeeDirectory::getManagerSub);
  }

  private User toUser(EmployeeDirectory d) {
    return new User(
        d.getSub(), d.getName(), d.getEmail(), d.getTitle(), d.getDepartment(), d.getAvatarUrl());
  }
}
