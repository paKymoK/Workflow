package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.Department;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface DepartmentRepository extends R2dbcRepository<Department, Long> {}
