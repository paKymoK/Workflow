package com.takypok.employeeservice.service;

import com.takypok.employeeservice.model.entity.EmployeeLeaveBalance;
import com.takypok.employeeservice.model.entity.LeaveType;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EmployeeLeaveBalanceService {
  /**
   * Current-year balances for every leave type, synthesizing a default-total, zero-used row (not
   * persisted) for any type that has no row yet.
   */
  Flux<EmployeeLeaveBalance> getBalances(String sub);

  /**
   * Adds {@code days} to the current year's usedDays for the given type, creating the row (with a
   * default total) first if needed.
   */
  Mono<EmployeeLeaveBalance> incrementUsedDays(String sub, LeaveType leaveType, int days);
}
