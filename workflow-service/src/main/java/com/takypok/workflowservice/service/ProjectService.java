package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Project;
import java.util.List;
import reactor.core.publisher.Mono;

public interface ProjectService {
  Mono<List<Project>> get();

  Mono<Project> getById(Long id);

  Mono<List<IssueType>> getIssueTypeByProjectId(Long id);
}
