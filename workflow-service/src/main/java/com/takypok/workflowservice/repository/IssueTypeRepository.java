package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.IssueType;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface IssueTypeRepository extends R2dbcRepository<IssueType, Long> {}
