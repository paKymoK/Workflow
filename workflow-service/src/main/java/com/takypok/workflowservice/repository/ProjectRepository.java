package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Project;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface ProjectRepository extends R2dbcRepository<Project, Long> {}
