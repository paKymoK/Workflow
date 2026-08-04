package com.takypok.employeeservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.employeeservice.model.entity.Department;
import com.takypok.employeeservice.repository.DepartmentRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Read-only view over auth-service's Department data, served from the Kafka-fed mirror kept here
 * (see DepartmentEventConsumer) — lets the frontend query org structure from employee-service
 * instead of a second cross-service call to auth-service. Create/update/delete stay on
 * auth-service, the authoritative owner.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/departments")
public class DepartmentController {
  private final DepartmentRepository departmentRepository;

  @GetMapping
  public Mono<ResultMessage<List<Department>>> get() {
    return departmentRepository
        .findAll()
        .collectList()
        .map(list -> list.stream().sorted(Comparator.comparing(Department::getName)).toList())
        .map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Department>> getById(@PathVariable Long id) {
    return departmentRepository.findById(id).map(ResultMessage::success);
  }
}
