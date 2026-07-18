package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.entity.EmployeeContract;
import com.takypok.employeeservice.model.request.ContractCreateRequest;
import com.takypok.employeeservice.model.request.ContractUpdateRequest;
import java.util.List;
import reactor.core.publisher.Mono;

public interface EmployeeContractService {
  Mono<List<EmployeeContract>> getBySub(String sub);

  Mono<EmployeeContract> create(String sub, ContractCreateRequest request);

  Mono<EmployeeContract> update(Long id, ContractUpdateRequest request);
}
