package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.Unit;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface UnitRepository extends R2dbcRepository<Unit, Long> {
  Flux<Unit> findByDepartmentIdOrderByName(Long departmentId);
}
