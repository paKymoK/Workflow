package com.takypok.employeeservice.config;

import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.event.AccountEvent;
import com.takypok.employeeservice.model.event.EmployeeEventType;
import com.takypok.employeeservice.repository.EmployeeRepository;
import com.takypok.employeeservice.service.EmployeeEventPublisher;
import com.takypok.employeeservice.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

/**
 * Reacts to auth-service confirming a sub is real, or auth-service's Userinfo record for a sub
 * changing afterward (Phase 7: name/email/department/unit are auth-service-owned data now). Fully
 * trusts the event and upserts those four fields — a new sub creates a shell {@link Employee} row
 * (the only way one comes into existence — {@code POST /v1/employees} is gone); an existing sub
 * only has name/email/departmentId/unitId overwritten, leaving title/workLocation/managerSub/etc. —
 * still employee-service's own domain — untouched.
 *
 * <p>Every write here also republishes {@code employee.events} (same as every other write path in
 * {@link com.takypok.employeeservice.service.impl.EmployeeServiceImpl}) — without this,
 * workflow-service's and chat-service's local directories would silently go stale for anyone whose
 * name/email/department/unit last changed via the auth-service path rather than a direct
 * employee-service update (found during Phase 7 regression testing).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountEventConsumer {
  private final EmployeeRepository employeeRepository;
  private final R2dbcEntityTemplate r2dbcEntityTemplate;
  private final EmployeeService employeeService;
  private final EmployeeEventPublisher eventPublisher;

  @KafkaListener(
      topics = "${account-events.topic:account.events}",
      groupId = "${spring.application.name}")
  public void onAccountEvent(AccountEvent event) {
    if (event == null || event.getSub() == null) {
      log.warn("Ignoring malformed account event: {}", event);
      return;
    }
    employeeRepository
        .findById(event.getSub())
        .flatMap(
            existing -> {
              existing.setName(event.getName());
              existing.setEmail(event.getEmail());
              existing.setDepartmentId(event.getDepartmentId());
              existing.setUnitId(event.getUnitId());
              return employeeRepository
                  .save(existing)
                  .map(saved -> Tuples.of(saved, EmployeeEventType.UPDATED));
            })
        .switchIfEmpty(
            Mono.defer(
                () -> {
                  Employee shell = new Employee();
                  shell.setSub(event.getSub());
                  shell.setName(event.getName());
                  shell.setEmail(event.getEmail());
                  shell.setDepartmentId(event.getDepartmentId());
                  shell.setUnitId(event.getUnitId());
                  shell.setStatus(EmploymentStatus.ACTIVE);
                  // `sub` is a manually-assigned key, so repository.save() would misread this as
                  // an update (see EmployeeServiceImpl.create()) — insert explicitly instead.
                  return r2dbcEntityTemplate
                      .insert(Employee.class)
                      .using(shell)
                      .map(saved -> Tuples.of(saved, EmployeeEventType.CREATED));
                }))
        .flatMap(
            tuple ->
                employeeService
                    .getBySub(tuple.getT1().getSub())
                    .flatMap(response -> eventPublisher.publish(tuple.getT2(), response)))
        .doOnError(
            ex -> log.error("Failed to process account event for sub {}", event.getSub(), ex))
        .onErrorResume(ex -> Mono.empty())
        .subscribe();
  }
}
