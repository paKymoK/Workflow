package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.entity.Unit;
import com.takypok.employeeservice.model.request.UnitCreateRequest;
import com.takypok.employeeservice.model.request.UnitUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface UnitService {
  Mono<List<Unit>> get(Long departmentId);

  Mono<Unit> getById(Long id);

  Mono<Unit> create(UnitCreateRequest request);

  Mono<Unit> update(UnitUpdateRequest request);

  Mono<Void> delete(Long id);
}
