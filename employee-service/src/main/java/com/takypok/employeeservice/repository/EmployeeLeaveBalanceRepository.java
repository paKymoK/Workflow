package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.EmployeeLeaveBalance;
import com.takypok.employeeservice.model.entity.LeaveType;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EmployeeLeaveBalanceRepository
    extends R2dbcRepository<EmployeeLeaveBalance, Long> {
  Flux<EmployeeLeaveBalance> findBySubAndYear(String sub, int year);

  Mono<EmployeeLeaveBalance> findBySubAndLeaveTypeAndYear(
      String sub, LeaveType leaveType, int year);
}
