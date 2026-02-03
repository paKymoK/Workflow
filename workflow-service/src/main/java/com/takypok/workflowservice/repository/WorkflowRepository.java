package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Workflow;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface WorkflowRepository extends R2dbcRepository<Workflow, Long> {}
