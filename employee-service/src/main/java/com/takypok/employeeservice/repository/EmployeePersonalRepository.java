package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.EmployeePersonal;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface EmployeePersonalRepository extends R2dbcRepository<EmployeePersonal, String> {}
