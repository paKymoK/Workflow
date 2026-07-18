package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.entity.EmployeePersonal;
import com.takypok.employeeservice.model.request.EmployeePersonalRequest;
import reactor.core.publisher.Mono;

public interface EmployeePersonalService {
  Mono<EmployeePersonal> getBySub(String sub);

  /** Creates the record on first write, updates it on every write after. */
  Mono<EmployeePersonal> upsert(String sub, EmployeePersonalRequest request);
}
