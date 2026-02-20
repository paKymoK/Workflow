package com.takypok.workflowservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Project;
import com.takypok.workflowservice.repository.IssueTypeRepository;
import com.takypok.workflowservice.repository.ProjectRepository;
import com.takypok.workflowservice.service.ProjectService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {
  private final ProjectRepository projectRepository;
  private final IssueTypeRepository issueTypeRepository;

  @Override
  public Mono<List<Project>> get() {
    return projectRepository.findAll().collectList();
  }

  @Override
  public Mono<Project> getById(Long id) {
    return projectRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Project not existed")));
  }

  @Override
  public Mono<List<IssueType>> getIssueTypeByProjectId(Long id) {
    return issueTypeRepository.findAllByProjectId(id).collectList();
  }
}
