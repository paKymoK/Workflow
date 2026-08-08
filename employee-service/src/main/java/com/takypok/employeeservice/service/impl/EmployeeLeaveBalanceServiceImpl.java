package com.takypok.employeeservice.service.impl;

import com.takypok.employeeservice.model.entity.EmployeeLeaveBalance;
import com.takypok.employeeservice.model.entity.LeaveType;
import com.takypok.employeeservice.repository.EmployeeLeaveBalanceRepository;
import com.takypok.employeeservice.service.EmployeeLeaveBalanceService;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class EmployeeLeaveBalanceServiceImpl implements EmployeeLeaveBalanceService {
  private final EmployeeLeaveBalanceRepository employeeLeaveBalanceRepository;

  private static final Map<LeaveType, Integer> DEFAULT_TOTAL_DAYS =
      Map.of(
          LeaveType.ANNUAL, 15,
          LeaveType.SICK, 10,
          LeaveType.PERSONAL, 3,
          LeaveType.UNPAID, 0,
          LeaveType.MATERNITY, 90);

  @Override
  public Flux<EmployeeLeaveBalance> getBalances(String sub) {
    int year = ZonedDateTime.now().getYear();
    return employeeLeaveBalanceRepository
        .findBySubAndYear(sub, year)
        .collectList()
        .flatMapMany(
            existing -> {
              Set<LeaveType> present =
                  existing.stream()
                      .map(EmployeeLeaveBalance::getLeaveType)
                      .collect(Collectors.toSet());
              List<EmployeeLeaveBalance> all = new ArrayList<>(existing);
              for (LeaveType type : LeaveType.values()) {
                if (!present.contains(type)) {
                  all.add(defaultBalance(sub, type, year));
                }
              }
              return Flux.fromIterable(all);
            });
  }

  @Override
  public Mono<EmployeeLeaveBalance> incrementUsedDays(String sub, LeaveType leaveType, int days) {
    int year = ZonedDateTime.now().getYear();
    return employeeLeaveBalanceRepository
        .findBySubAndLeaveTypeAndYear(sub, leaveType, year)
        .defaultIfEmpty(defaultBalance(sub, leaveType, year))
        .flatMap(
            balance -> {
              balance.setUsedDays(balance.getUsedDays() + days);
              return employeeLeaveBalanceRepository.save(balance);
            });
  }

  private EmployeeLeaveBalance defaultBalance(String sub, LeaveType leaveType, int year) {
    EmployeeLeaveBalance balance = new EmployeeLeaveBalance();
    balance.setSub(sub);
    balance.setLeaveType(leaveType);
    balance.setYear(year);
    balance.setTotalDays(DEFAULT_TOTAL_DAYS.get(leaveType));
    balance.setUsedDays(0);
    return balance;
  }
}
