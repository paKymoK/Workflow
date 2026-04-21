package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Project;
import com.takypok.workflowservice.model.request.ProjectCreateRequest;
import com.takypok.workflowservice.model.request.ProjectUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface ProjectService {
  Mono<List<Project>> get();

  Mono<Project> getById(Long id);

  Mono<List<IssueType>> getIssueTypeByProjectId(Long id);

  Mono<Project> create(ProjectCreateRequest request);

  Mono<Project> update(ProjectUpdateRequest request);

  Mono<Void> delete(Long id);
}
