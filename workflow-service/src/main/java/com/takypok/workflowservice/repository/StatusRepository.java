package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Status;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface StatusRepository extends R2dbcRepository<Status, Long> {}
