package com.takypok.employeeservice.service.impl;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.exception.EmployeeNotFoundException;
import com.takypok.employeeservice.exception.InvalidManagerException;
import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.event.EmployeeEventType;
import com.takypok.employeeservice.model.mapper.EmployeeMapper;
import com.takypok.employeeservice.model.request.CreateEmployeeRequest;
import com.takypok.employeeservice.model.request.FilterEmployeeRequest;
import com.takypok.employeeservice.model.request.ManagerUpdateRequest;
import com.takypok.employeeservice.model.request.StatusUpdateRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import com.takypok.employeeservice.model.response.OrgChartNode;
import com.takypok.employeeservice.model.response.OrgChartResponse;
import com.takypok.employeeservice.repository.EmployeeRepository;
import com.takypok.employeeservice.service.EmployeeEventPublisher;
import com.takypok.employeeservice.service.EmployeeService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

  /** Guards against a corrupt/cyclic manager chain when walking up for the org chart. */
  private static final int MAX_CHAIN_DEPTH = 50;

  private final EmployeeRepository employeeRepository;
  private final EmployeeMapper employeeMapper;
  private final EmployeeEventPublisher eventPublisher;

  @Override
  public Mono<EmployeeResponse> create(CreateEmployeeRequest request) {
    Employee employee = employeeMapper.toEntity(request);
    return employeeRepository
        .save(employee)
        .map(employeeMapper::toResponse)
        .flatMap(response -> publishAndReturn(EmployeeEventType.CREATED, response));
  }

  @Override
  public Mono<PageResponse<EmployeeResponse>> list(FilterEmployeeRequest request) {
    String status = request.getStatus() == null ? null : request.getStatus().name();
    int size = request.getSize().intValue();
    long offset = request.getPage() * size;
    Flux<Employee> content =
        employeeRepository.search(
            request.getQ(),
            request.getDepartment(),
            request.getLine(),
            status,
            request.getManagerId(),
            size,
            offset);
    Mono<Long> total =
        employeeRepository.count(
            request.getQ(),
            request.getDepartment(),
            request.getLine(),
            status,
            request.getManagerId());
    return content
        .collectList()
        .zipWith(total)
        .map(
            tuple ->
                employeeMapper.toPageResponse(
                    tuple.getT1(), request.getPage(), request.getSize(), tuple.getT2()));
  }

  @Override
  public Mono<EmployeeResponse> getById(Long id) {
    return findByIdOrError(id).map(employeeMapper::toResponse);
  }

  @Override
  public Mono<EmployeeResponse> getBySub(String sub) {
    return employeeRepository
        .findBySub(sub)
        .switchIfEmpty(Mono.error(new EmployeeNotFoundException("No employee for sub " + sub)))
        .map(employeeMapper::toResponse);
  }

  @Override
  public Mono<EmployeeResponse> update(Long id, UpdateEmployeeRequest request) {
    return findByIdOrError(id)
        .flatMap(
            employee -> {
              employeeMapper.updateEntity(request, employee);
              return employeeRepository.save(employee);
            })
        .map(employeeMapper::toResponse)
        .flatMap(response -> publishAndReturn(EmployeeEventType.UPDATED, response));
  }

  @Override
  public Mono<EmployeeResponse> updateStatus(Long id, StatusUpdateRequest request) {
    return findByIdOrError(id)
        .flatMap(
            employee -> {
              employee.setStatus(request.getStatus());
              return employeeRepository.save(employee);
            })
        .map(employeeMapper::toResponse)
        .flatMap(response -> publishAndReturn(EmployeeEventType.STATUS_CHANGED, response));
  }

  @Override
  public Mono<EmployeeResponse> updateManager(Long id, ManagerUpdateRequest request) {
    Long managerId = request.getManagerId();
    if (managerId == null) {
      return findByIdOrError(id)
          .flatMap(
              employee -> {
                employee.setManagerId(null);
                return employeeRepository.save(employee);
              })
          .map(employeeMapper::toResponse)
          .flatMap(response -> publishAndReturn(EmployeeEventType.MANAGER_CHANGED, response));
    }
    if (managerId.equals(id)) {
      return Mono.error(new InvalidManagerException("An employee cannot be their own manager"));
    }
    return findByIdOrError(id)
        .flatMap(
            employee ->
                assertNotInChain(managerId, id)
                    .then(
                        Mono.defer(
                            () -> {
                              employee.setManagerId(managerId);
                              return employeeRepository.save(employee);
                            })))
        .map(employeeMapper::toResponse)
        .flatMap(response -> publishAndReturn(EmployeeEventType.MANAGER_CHANGED, response));
  }

  @Override
  public Mono<OrgChartResponse> getOrgChart(Long id) {
    return findByIdOrError(id)
        .flatMap(
            self ->
                buildChain(self, MAX_CHAIN_DEPTH)
                    .zipWith(
                        employeeRepository
                            .findByManagerIdOrderByName(id)
                            .map(this::toNode)
                            .collectList())
                    .map(tuple -> new OrgChartResponse(tuple.getT1(), tuple.getT2())));
  }

  @Override
  public Flux<EmployeeResponse> getReports(Long id) {
    return employeeRepository.findByManagerIdOrderByName(id).map(employeeMapper::toResponse);
  }

  private Mono<EmployeeResponse> publishAndReturn(
      EmployeeEventType type, EmployeeResponse response) {
    return eventPublisher.publish(type, response).thenReturn(response);
  }

  private Mono<Employee> findByIdOrError(Long id) {
    return employeeRepository
        .findById(id)
        .switchIfEmpty(Mono.error(new EmployeeNotFoundException("No employee with id " + id)));
  }

  /** Walks managerId up from `self`, so a cycle in the data can't spin forever. */
  private Mono<List<OrgChartNode>> buildChain(Employee self, int depthRemaining) {
    return walkUp(self, depthRemaining)
        .map(
            ancestors -> {
              List<OrgChartNode> chain = new ArrayList<>();
              for (int i = ancestors.size() - 1; i >= 0; i--) {
                Employee e = ancestors.get(i);
                // ancestors is built [self, manager, grandmanager, ...], so index 1 is always
                // the immediate manager regardless of how deep the chain goes.
                boolean isSelf = i == 0;
                boolean isManager = i == 1;
                chain.add(
                    new OrgChartNode(
                        e.getId(),
                        e.getEmployeeCode(),
                        e.getName(),
                        e.getTitle(),
                        isManager,
                        isSelf));
              }
              return chain;
            });
  }

  private Mono<List<Employee>> walkUp(Employee self, int depthRemaining) {
    List<Employee> acc = new ArrayList<>();
    acc.add(self);
    return walkUpRec(self, acc, depthRemaining);
  }

  private Mono<List<Employee>> walkUpRec(Employee current, List<Employee> acc, int depthRemaining) {
    if (current.getManagerId() == null || depthRemaining <= 0) {
      return Mono.just(acc);
    }
    return employeeRepository
        .findById(current.getManagerId())
        .flatMap(
            manager -> {
              acc.add(manager);
              return walkUpRec(manager, acc, depthRemaining - 1);
            })
        .switchIfEmpty(Mono.just(acc));
  }

  /** Rejects reassignment if `candidateManagerId` is a descendant of `employeeId` (would cycle). */
  private Mono<Void> assertNotInChain(Long candidateManagerId, Long employeeId) {
    return employeeRepository
        .findById(candidateManagerId)
        .switchIfEmpty(
            Mono.error(new EmployeeNotFoundException("No employee with id " + candidateManagerId)))
        .flatMap(candidate -> walkUp(candidate, MAX_CHAIN_DEPTH))
        .flatMap(
            chain -> {
              boolean cycles = chain.stream().anyMatch(e -> e.getId().equals(employeeId));
              if (cycles) {
                return Mono.error(
                    new InvalidManagerException("That reassignment would create a manager cycle"));
              }
              return Mono.empty();
            });
  }

  private OrgChartNode toNode(Employee e) {
    return new OrgChartNode(
        e.getId(), e.getEmployeeCode(), e.getName(), e.getTitle(), false, false);
  }
}
