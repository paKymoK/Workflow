package com.takypok.employeeservice.config;

import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.event.AccountEvent;
import com.takypok.employeeservice.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Reacts to auth-service confirming a sub is real (guest account created, or first LDAP login) by
 * creating an empty PENDING shell — the only way an {@link Employee} row comes into existence now.
 * {@code POST /v1/employees} is gone; a hand-typed sub can never create a row again.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountEventConsumer {
  private final EmployeeRepository employeeRepository;
  private final R2dbcEntityTemplate r2dbcEntityTemplate;

  @KafkaListener(
      topics = "${account-events.topic:account.events}",
      groupId = "${spring.application.name}")
  public void onAccountEvent(AccountEvent event) {
    if (event == null || event.getSub() == null) {
      log.warn("Ignoring malformed account event: {}", event);
      return;
    }
    employeeRepository
        .existsById(event.getSub())
        .flatMap(
            exists -> {
              if (exists) {
                return Mono.empty();
              }
              Employee shell = new Employee();
              shell.setSub(event.getSub());
              shell.setStatus(EmploymentStatus.PENDING);
              // `sub` is a manually-assigned key, so repository.save() would misread this as an
              // update (see EmployeeServiceImpl.create()) — insert explicitly instead.
              return r2dbcEntityTemplate.insert(Employee.class).using(shell);
            })
        .doOnError(
            ex -> log.error("Failed to process account event for sub {}", event.getSub(), ex))
        .onErrorResume(ex -> Mono.empty())
        .subscribe();
  }
}
