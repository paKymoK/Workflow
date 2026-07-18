package com.takypok.employeeservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.employeeservice.model.entity.Department;
import com.takypok.employeeservice.model.request.DepartmentCreateRequest;
import com.takypok.employeeservice.model.request.DepartmentUpdateRequest;
import com.takypok.employeeservice.service.DepartmentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/departments")
public class DepartmentController {
  private final DepartmentService departmentService;

  @GetMapping("")
  public Mono<ResultMessage<List<Department>>> get() {
    return departmentService.get().map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Department>> getById(@PathVariable Long id) {
    return departmentService.getById(id).map(ResultMessage::success);
  }

  @PostMapping("")
  public Mono<ResultMessage<Department>> create(
      @Valid @RequestBody DepartmentCreateRequest request) {
    return departmentService.create(request).map(ResultMessage::success);
  }

  @PutMapping("")
  public Mono<ResultMessage<Department>> update(
      @Valid @RequestBody DepartmentUpdateRequest request) {
    return departmentService.update(request).map(ResultMessage::success);
  }

  @DeleteMapping("/{id}")
  public Mono<ResultMessage<Void>> delete(@PathVariable Long id) {
    return departmentService.delete(id).then(Mono.just(ResultMessage.success(null)));
  }
}
