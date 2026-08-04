package com.takypok.employeeservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.employeeservice.model.entity.Unit;
import com.takypok.employeeservice.repository.UnitRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Read-only view over auth-service's Unit data, served from the Kafka-fed mirror kept here (see
 * UnitEventConsumer). Create/update/delete stay on auth-service, the authoritative owner.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/units")
public class UnitController {
  private final UnitRepository unitRepository;

  @GetMapping
  public Mono<ResultMessage<List<Unit>>> get(@RequestParam(required = false) Long departmentId) {
    Flux<Unit> units =
        departmentId != null
            ? unitRepository.findByDepartmentIdOrderByName(departmentId)
            : unitRepository.findAll();
    return units
        .collectList()
        .map(list -> list.stream().sorted(Comparator.comparing(Unit::getName)).toList())
        .map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Unit>> getById(@PathVariable Long id) {
    return unitRepository.findById(id).map(ResultMessage::success);
  }
}
