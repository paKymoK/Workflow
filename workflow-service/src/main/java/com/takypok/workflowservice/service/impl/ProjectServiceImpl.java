package com.takypok.workflowservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Project;
import com.takypok.workflowservice.model.request.ProjectCreateRequest;
import com.takypok.workflowservice.model.request.ProjectUpdateRequest;
import com.takypok.workflowservice.repository.IssueTypeRepository;
import com.takypok.workflowservice.repository.ProjectRepository;
import com.takypok.workflowservice.repository.WorkflowRepository;
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
  private final WorkflowRepository workflowRepository;

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

  @Override
  public Mono<Project> create(ProjectCreateRequest request) {
    return workflowRepository
        .findById(request.getWorkflowId())
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Workflow not existed")))
        .flatMap(
            workflow -> {
              Project project = new Project();
              project.setName(request.getName());
              project.setCode(request.getCode());
              project.setWorkflowId(request.getWorkflowId());
              return projectRepository.save(project);
            });
  }

  @Override
  public Mono<Project> update(ProjectUpdateRequest request) {
    return projectRepository
        .findById(request.getId())
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Project not existed")))
        .flatMap(
            project ->
                workflowRepository
                    .findById(request.getWorkflowId())
                    .switchIfEmpty(
                        Mono.error(
                            new ApplicationException(
                                Message.Application.ERROR, "Workflow not existed")))
                    .flatMap(
                        workflow -> {
                          project.setName(request.getName());
                          project.setCode(request.getCode());
                          project.setWorkflowId(request.getWorkflowId());
                          return projectRepository.save(project);
                        }));
  }

  @Override
  public Mono<Void> delete(Long id) {
    return getById(id).flatMap(projectRepository::delete);
  }
}
