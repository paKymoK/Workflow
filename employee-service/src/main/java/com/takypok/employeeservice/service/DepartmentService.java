package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.entity.Department;
import com.takypok.employeeservice.model.request.DepartmentCreateRequest;
import com.takypok.employeeservice.model.request.DepartmentUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface DepartmentService {
  Mono<List<Department>> get();

  Mono<Department> getById(Long id);

  Mono<Department> create(DepartmentCreateRequest request);

  Mono<Department> update(DepartmentUpdateRequest request);

  Mono<Void> delete(Long id);
}
