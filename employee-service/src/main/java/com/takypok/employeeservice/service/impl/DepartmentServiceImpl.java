package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.employeeservice.model.entity.Department;
import com.takypok.employeeservice.model.request.DepartmentCreateRequest;
import com.takypok.employeeservice.model.request.DepartmentUpdateRequest;
import com.takypok.employeeservice.repository.DepartmentRepository;
import com.takypok.employeeservice.service.DepartmentService;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {
  private final DepartmentRepository departmentRepository;

  @Override
  public Mono<List<Department>> get() {
    return departmentRepository
        .findAll()
        .collectSortedList(Comparator.comparing(Department::getName));
  }

  @Override
  public Mono<Department> getById(Long id) {
    return departmentRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Department not found")));
  }

  @Override
  public Mono<Department> create(DepartmentCreateRequest request) {
    Department department = new Department();
    department.setName(request.getName());
    return departmentRepository.save(department);
  }

  @Override
  public Mono<Department> update(DepartmentUpdateRequest request) {
    return getById(request.getId())
        .flatMap(
            department -> {
              department.setName(request.getName());
              return departmentRepository.save(department);
            });
  }

  @Override
  public Mono<Void> delete(Long id) {
    return getById(id).flatMap(departmentRepository::delete);
  }
}
