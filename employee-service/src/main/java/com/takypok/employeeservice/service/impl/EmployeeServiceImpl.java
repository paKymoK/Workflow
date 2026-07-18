package com.takypok.employeeservice.service.impl;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.exception.EmployeeNotFoundException;
import com.takypok.employeeservice.exception.InvalidManagerException;
import com.takypok.employeeservice.model.entity.Department;
import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.entity.Unit;
import com.takypok.employeeservice.model.event.EmployeeEventType;
import com.takypok.employeeservice.model.mapper.EmployeeMapper;
import com.takypok.employeeservice.model.request.FilterEmployeeRequest;
import com.takypok.employeeservice.model.request.ManagerUpdateRequest;
import com.takypok.employeeservice.model.request.StatusUpdateRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import com.takypok.employeeservice.model.response.OrgChartNode;
import com.takypok.employeeservice.model.response.OrgChartResponse;
import com.takypok.employeeservice.repository.DepartmentRepository;
import com.takypok.employeeservice.repository.EmployeeRepository;
import com.takypok.employeeservice.repository.UnitRepository;
import com.takypok.employeeservice.service.EmployeeEventPublisher;
import com.takypok.employeeservice.service.EmployeeService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
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
  private final DepartmentRepository departmentRepository;
  private final UnitRepository unitRepository;
  private final EmployeeMapper employeeMapper;
  private final EmployeeEventPublisher eventPublisher;

  @Override
  public Mono<PageResponse<EmployeeResponse>> list(FilterEmployeeRequest request) {
    String status = request.getStatus() == null ? null : request.getStatus().name();
    int size = request.getSize().intValue();
    long offset = request.getPage() * size;
    Flux<Employee> content =
        employeeRepository.search(
            request.getQ(),
            request.getDepartmentId(),
            request.getUnitId(),
            status,
            request.getManagerSub(),
            size,
            offset);
    Mono<Long> total =
        employeeRepository.count(
            request.getQ(),
            request.getDepartmentId(),
            request.getUnitId(),
            status,
            request.getManagerSub());
    return content
        .collectList()
        .zipWith(total)
        .flatMap(
            tuple ->
                enrichList(tuple.getT1())
                    .map(
                        responses ->
                            buildPageResponse(
                                responses, request.getPage(), request.getSize(), tuple.getT2())));
  }

  @Override
  public Mono<EmployeeResponse> getBySub(String sub) {
    return findByIdOrError(sub).flatMap(this::enrichOne);
  }

  @Override
  public Mono<EmployeeResponse> update(String sub, UpdateEmployeeRequest request) {
    return findByIdOrError(sub)
        .flatMap(
            employee -> {
              employeeMapper.updateEntity(request, employee);
              return employeeRepository.save(employee);
            })
        .flatMap(this::enrichOne)
        .flatMap(response -> publishAndReturn(EmployeeEventType.UPDATED, response));
  }

  @Override
  public Mono<EmployeeResponse> updateStatus(String sub, StatusUpdateRequest request) {
    return findByIdOrError(sub)
        .flatMap(
            employee -> {
              employee.setStatus(request.getStatus());
              return employeeRepository.save(employee);
            })
        .flatMap(this::enrichOne)
        .flatMap(response -> publishAndReturn(EmployeeEventType.STATUS_CHANGED, response));
  }

  @Override
  public Mono<EmployeeResponse> updateManager(String sub, ManagerUpdateRequest request) {
    String managerSub = request.getManagerSub();
    if (managerSub == null) {
      return findByIdOrError(sub)
          .flatMap(
              employee -> {
                employee.setManagerSub(null);
                return employeeRepository.save(employee);
              })
          .flatMap(this::enrichOne)
          .flatMap(response -> publishAndReturn(EmployeeEventType.MANAGER_CHANGED, response));
    }
    if (managerSub.equals(sub)) {
      return Mono.error(new InvalidManagerException("An employee cannot be their own manager"));
    }
    return findByIdOrError(sub)
        .flatMap(
            employee ->
                assertNotInChain(managerSub, sub)
                    .then(
                        Mono.defer(
                            () -> {
                              employee.setManagerSub(managerSub);
                              return employeeRepository.save(employee);
                            })))
        .flatMap(this::enrichOne)
        .flatMap(response -> publishAndReturn(EmployeeEventType.MANAGER_CHANGED, response));
  }

  @Override
  public Mono<EmployeeResponse> updateAvatar(String sub, String avatarUrl) {
    return findByIdOrError(sub)
        .flatMap(
            employee -> {
              employee.setAvatarUrl(avatarUrl);
              return employeeRepository.save(employee);
            })
        .flatMap(this::enrichOne)
        .flatMap(response -> publishAndReturn(EmployeeEventType.UPDATED, response));
  }

  @Override
  public Mono<OrgChartResponse> getOrgChart(String sub) {
    return findByIdOrError(sub)
        .flatMap(
            self ->
                buildChain(self, MAX_CHAIN_DEPTH)
                    .zipWith(
                        employeeRepository
                            .findByManagerSubOrderByName(sub)
                            .map(this::toNode)
                            .collectList())
                    .map(tuple -> new OrgChartResponse(tuple.getT1(), tuple.getT2())));
  }

  @Override
  public Flux<EmployeeResponse> getReports(String sub) {
    return employeeRepository
        .findByManagerSubOrderByName(sub)
        .collectList()
        .flatMapMany(employees -> enrichList(employees).flatMapMany(Flux::fromIterable));
  }

  private Mono<EmployeeResponse> publishAndReturn(
      EmployeeEventType type, EmployeeResponse response) {
    return eventPublisher.publish(type, response).thenReturn(response);
  }

  private Mono<Employee> findByIdOrError(String sub) {
    return employeeRepository
        .findById(sub)
        .switchIfEmpty(Mono.error(new EmployeeNotFoundException("No employee with sub " + sub)));
  }

  /** Resolves department/unit names for a single employee — one lookup each, at most. */
  private Mono<EmployeeResponse> enrichOne(Employee employee) {
    EmployeeResponse response = employeeMapper.toResponse(employee);
    Mono<EmployeeResponse> withDepartment =
        employee.getDepartmentId() == null
            ? Mono.just(response)
            : departmentRepository
                .findById(employee.getDepartmentId())
                .map(
                    d -> {
                      response.setDepartmentName(d.getName());
                      return response;
                    })
                .defaultIfEmpty(response);
    return withDepartment.flatMap(
        r ->
            employee.getUnitId() == null
                ? Mono.just(r)
                : unitRepository
                    .findById(employee.getUnitId())
                    .map(
                        u -> {
                          r.setUnitName(u.getName());
                          return r;
                        })
                    .defaultIfEmpty(r));
  }

  /** Resolves department/unit names for a batch of employees with one query per lookup table. */
  private Mono<List<EmployeeResponse>> enrichList(List<Employee> employees) {
    List<Long> departmentIds =
        employees.stream()
            .map(Employee::getDepartmentId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
    List<Long> unitIds =
        employees.stream().map(Employee::getUnitId).filter(Objects::nonNull).distinct().toList();
    Mono<Map<Long, String>> departmentNames =
        departmentRepository
            .findAllById(departmentIds)
            .collectMap(Department::getId, Department::getName);
    Mono<Map<Long, String>> unitNames =
        unitRepository.findAllById(unitIds).collectMap(Unit::getId, Unit::getName);
    return Mono.zip(departmentNames, unitNames)
        .map(
            tuple ->
                employees.stream()
                    .map(
                        e -> {
                          EmployeeResponse response = employeeMapper.toResponse(e);
                          response.setDepartmentName(tuple.getT1().get(e.getDepartmentId()));
                          response.setUnitName(tuple.getT2().get(e.getUnitId()));
                          return response;
                        })
                    .collect(Collectors.toList()));
  }

  private PageResponse<EmployeeResponse> buildPageResponse(
      List<EmployeeResponse> content, long page, long size, long totalElements) {
    long totalPages = size == 0 ? 0 : (long) Math.ceil((double) totalElements / size);
    return new PageResponse<>(content, page, size, totalElements, totalPages);
  }

  /** Walks managerSub up from `self`, so a cycle in the data can't spin forever. */
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
                    new OrgChartNode(e.getSub(), e.getName(), e.getTitle(), isManager, isSelf));
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
    if (current.getManagerSub() == null || depthRemaining <= 0) {
      return Mono.just(acc);
    }
    return employeeRepository
        .findById(current.getManagerSub())
        .flatMap(
            manager -> {
              acc.add(manager);
              return walkUpRec(manager, acc, depthRemaining - 1);
            })
        .switchIfEmpty(Mono.just(acc));
  }

  /** Rejects reassignment if `candidateManagerSub` is a descendant of `sub` (would cycle). */
  private Mono<Void> assertNotInChain(String candidateManagerSub, String sub) {
    return employeeRepository
        .findById(candidateManagerSub)
        .switchIfEmpty(
            Mono.error(
                new EmployeeNotFoundException("No employee with sub " + candidateManagerSub)))
        .flatMap(candidate -> walkUp(candidate, MAX_CHAIN_DEPTH))
        .flatMap(
            chain -> {
              boolean cycles = chain.stream().anyMatch(e -> e.getSub().equals(sub));
              if (cycles) {
                return Mono.error(
                    new InvalidManagerException("That reassignment would create a manager cycle"));
              }
              return Mono.empty();
            });
  }

  private OrgChartNode toNode(Employee e) {
    return new OrgChartNode(e.getSub(), e.getName(), e.getTitle(), false, false);
  }
}
