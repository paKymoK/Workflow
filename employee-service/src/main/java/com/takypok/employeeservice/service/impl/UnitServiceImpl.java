package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.employeeservice.model.entity.Unit;
import com.takypok.employeeservice.model.request.UnitCreateRequest;
import com.takypok.employeeservice.model.request.UnitUpdateRequest;
import com.takypok.employeeservice.repository.UnitRepository;
import com.takypok.employeeservice.service.UnitService;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class UnitServiceImpl implements UnitService {
  private final UnitRepository unitRepository;

  @Override
  public Mono<List<Unit>> get(Long departmentId) {
    if (departmentId != null) {
      return unitRepository.findByDepartmentIdOrderByName(departmentId).collectList();
    }
    return unitRepository.findAll().collectSortedList(Comparator.comparing(Unit::getName));
  }

  @Override
  public Mono<Unit> getById(Long id) {
    return unitRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Unit not found")));
  }

  @Override
  public Mono<Unit> create(UnitCreateRequest request) {
    Unit unit = new Unit();
    unit.setName(request.getName());
    unit.setDepartmentId(request.getDepartmentId());
    return unitRepository.save(unit);
  }

  @Override
  public Mono<Unit> update(UnitUpdateRequest request) {
    return getById(request.getId())
        .flatMap(
            unit -> {
              unit.setName(request.getName());
              unit.setDepartmentId(request.getDepartmentId());
              return unitRepository.save(unit);
            });
  }

  @Override
  public Mono<Void> delete(Long id) {
    return getById(id).flatMap(unitRepository::delete);
  }
}
