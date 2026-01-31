package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Priority;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface PriorityRepository extends R2dbcRepository<Priority, Long> {}
