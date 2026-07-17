package com.takypok.employeeservice.controller;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.Roles;
import com.takypok.core.util.AuthenticationUtil;
import com.takypok.employeeservice.model.request.CreateEmployeeRequest;
import com.takypok.employeeservice.model.request.FilterEmployeeRequest;
import com.takypok.employeeservice.model.request.ManagerUpdateRequest;
import com.takypok.employeeservice.model.request.StatusUpdateRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import com.takypok.employeeservice.model.response.OrgChartResponse;
import com.takypok.employeeservice.service.EmployeeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/employees")
public class EmployeeController {
  private final EmployeeService employeeService;

  @PostMapping
  public Mono<ResultMessage<EmployeeResponse>> create(
      @RequestBody @Valid CreateEmployeeRequest request, Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.create(request))
        .map(ResultMessage::success);
  }

  @GetMapping
  public Mono<ResultMessage<PageResponse<EmployeeResponse>>> list(
      @Valid FilterEmployeeRequest request) {
    return employeeService.list(request).map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<EmployeeResponse>> getById(@PathVariable Long id) {
    return employeeService.getById(id).map(ResultMessage::success);
  }

  @GetMapping("/by-sub/{sub}")
  public Mono<ResultMessage<EmployeeResponse>> getBySub(@PathVariable String sub) {
    return employeeService.getBySub(sub).map(ResultMessage::success);
  }

  @PutMapping("/{id}")
  public Mono<ResultMessage<EmployeeResponse>> update(
      @PathVariable Long id,
      @RequestBody @Valid UpdateEmployeeRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.update(id, request))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{id}/status")
  public Mono<ResultMessage<EmployeeResponse>> updateStatus(
      @PathVariable Long id,
      @RequestBody @Valid StatusUpdateRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.updateStatus(id, request))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{id}/manager")
  public Mono<ResultMessage<EmployeeResponse>> updateManager(
      @PathVariable Long id,
      @RequestBody @Valid ManagerUpdateRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.updateManager(id, request))
        .map(ResultMessage::success);
  }

  @GetMapping("/{id}/org-chart")
  public Mono<ResultMessage<OrgChartResponse>> getOrgChart(@PathVariable Long id) {
    return employeeService.getOrgChart(id).map(ResultMessage::success);
  }

  @GetMapping("/{id}/reports")
  public Mono<ResultMessage<List<EmployeeResponse>>> getReports(@PathVariable Long id) {
    return employeeService.getReports(id).collectList().map(ResultMessage::success);
  }

  /** Write endpoints are ADMIN-only for now; a dedicated HR role can be split out later. */
  private Mono<Void> requireAdmin(Authentication authentication) {
    if (AuthenticationUtil.getRoles(authentication).contains(Roles.ADMIN)) {
      return Mono.empty();
    }
    return Mono.error(new ApplicationException(Message.Application.ERROR, "Admin role required"));
  }
}
