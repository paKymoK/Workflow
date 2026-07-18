package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.EmployeeContract;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface EmployeeContractRepository extends R2dbcRepository<EmployeeContract, Long> {
  Flux<EmployeeContract> findBySubOrderByStartDateDesc(String sub);
}
