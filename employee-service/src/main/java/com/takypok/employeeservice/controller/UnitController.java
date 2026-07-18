package com.takypok.employeeservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.employeeservice.model.entity.Unit;
import com.takypok.employeeservice.model.request.UnitCreateRequest;
import com.takypok.employeeservice.model.request.UnitUpdateRequest;
import com.takypok.employeeservice.service.UnitService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/units")
public class UnitController {
  private final UnitService unitService;

  @GetMapping("")
  public Mono<ResultMessage<List<Unit>>> get(@RequestParam(required = false) Long departmentId) {
    return unitService.get(departmentId).map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<Unit>> getById(@PathVariable Long id) {
    return unitService.getById(id).map(ResultMessage::success);
  }

  @PostMapping("")
  public Mono<ResultMessage<Unit>> create(@Valid @RequestBody UnitCreateRequest request) {
    return unitService.create(request).map(ResultMessage::success);
  }

  @PutMapping("")
  public Mono<ResultMessage<Unit>> update(@Valid @RequestBody UnitUpdateRequest request) {
    return unitService.update(request).map(ResultMessage::success);
  }

  @DeleteMapping("/{id}")
  public Mono<ResultMessage<Void>> delete(@PathVariable Long id) {
    return unitService.delete(id).then(Mono.just(ResultMessage.success(null)));
  }
}
