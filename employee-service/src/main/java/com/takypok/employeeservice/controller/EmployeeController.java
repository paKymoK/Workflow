package com.takypok.employeeservice.controller;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.Roles;
import com.takypok.core.util.AuthenticationUtil;
import com.takypok.employeeservice.model.entity.EmployeeContract;
import com.takypok.employeeservice.model.entity.EmployeePersonal;
import com.takypok.employeeservice.model.request.AvatarUpdateRequest;
import com.takypok.employeeservice.model.request.ContractCreateRequest;
import com.takypok.employeeservice.model.request.ContractUpdateRequest;
import com.takypok.employeeservice.model.request.EmployeePersonalRequest;
import com.takypok.employeeservice.model.request.FilterEmployeeRequest;
import com.takypok.employeeservice.model.request.ManagerUpdateRequest;
import com.takypok.employeeservice.model.request.StatusUpdateRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import com.takypok.employeeservice.model.response.OrgChartResponse;
import com.takypok.employeeservice.service.EmployeeContractService;
import com.takypok.employeeservice.service.EmployeePersonalService;
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
  private final EmployeePersonalService employeePersonalService;
  private final EmployeeContractService employeeContractService;

  // No create endpoint — rows only come into existence via AccountEventConsumer; PUT below is
  // strictly update-only (404s if the shell doesn't exist yet).

  @GetMapping
  public Mono<ResultMessage<PageResponse<EmployeeResponse>>> list(
      @Valid FilterEmployeeRequest request) {
    return employeeService.list(request).map(ResultMessage::success);
  }

  @GetMapping("/{sub}")
  public Mono<ResultMessage<EmployeeResponse>> getBySub(@PathVariable String sub) {
    return employeeService.getBySub(sub).map(ResultMessage::success);
  }

  @PutMapping("/{sub}")
  public Mono<ResultMessage<EmployeeResponse>> update(
      @PathVariable String sub,
      @RequestBody @Valid UpdateEmployeeRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.update(sub, request))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{sub}/status")
  public Mono<ResultMessage<EmployeeResponse>> updateStatus(
      @PathVariable String sub,
      @RequestBody @Valid StatusUpdateRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.updateStatus(sub, request))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{sub}/manager")
  public Mono<ResultMessage<EmployeeResponse>> updateManager(
      @PathVariable String sub,
      @RequestBody @Valid ManagerUpdateRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeService.updateManager(sub, request))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{sub}/avatar")
  public Mono<ResultMessage<EmployeeResponse>> updateAvatar(
      @PathVariable String sub,
      @RequestBody @Valid AvatarUpdateRequest request,
      Authentication authentication) {
    return requireSelfOrAdmin(sub, authentication)
        .then(employeeService.updateAvatar(sub, request.getAvatarUrl()))
        .map(ResultMessage::success);
  }

  @GetMapping("/{sub}/org-chart")
  public Mono<ResultMessage<OrgChartResponse>> getOrgChart(@PathVariable String sub) {
    return employeeService.getOrgChart(sub).map(ResultMessage::success);
  }

  @GetMapping("/{sub}/reports")
  public Mono<ResultMessage<List<EmployeeResponse>>> getReports(@PathVariable String sub) {
    return employeeService.getReports(sub).collectList().map(ResultMessage::success);
  }

  @GetMapping("/{sub}/personal")
  public Mono<ResultMessage<EmployeePersonal>> getPersonal(@PathVariable String sub) {
    return employeePersonalService.getBySub(sub).map(ResultMessage::success);
  }

  @PutMapping("/{sub}/personal")
  public Mono<ResultMessage<EmployeePersonal>> putPersonal(
      @PathVariable String sub,
      @RequestBody @Valid EmployeePersonalRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeePersonalService.upsert(sub, request))
        .map(ResultMessage::success);
  }

  @GetMapping("/{sub}/contracts")
  public Mono<ResultMessage<List<EmployeeContract>>> getContracts(@PathVariable String sub) {
    return employeeContractService.getBySub(sub).map(ResultMessage::success);
  }

  @PostMapping("/{sub}/contracts")
  public Mono<ResultMessage<EmployeeContract>> createContract(
      @PathVariable String sub,
      @RequestBody @Valid ContractCreateRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeContractService.create(sub, request))
        .map(ResultMessage::success);
  }

  @PutMapping("/{sub}/contracts/{id}")
  public Mono<ResultMessage<EmployeeContract>> updateContract(
      @PathVariable String sub,
      @PathVariable Long id,
      @RequestBody @Valid ContractUpdateRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(employeeContractService.update(id, request))
        .map(ResultMessage::success);
  }

  /** Write endpoints are ADMIN-only for now; a dedicated HR role can be split out later. */
  private Mono<Void> requireAdmin(Authentication authentication) {
    if (AuthenticationUtil.getRoles(authentication).contains(Roles.ADMIN)) {
      return Mono.empty();
    }
    return Mono.error(new ApplicationException(Message.Application.ERROR, "Admin role required"));
  }

  /** Avatar updates are self-service — the caller may always update their own. */
  private Mono<Void> requireSelfOrAdmin(String sub, Authentication authentication) {
    if (sub.equals(authentication.getName())
        || AuthenticationUtil.getRoles(authentication).contains(Roles.ADMIN)) {
      return Mono.empty();
    }
    return Mono.error(
        new ApplicationException(
            Message.Application.ERROR, "Not allowed to update this employee's avatar"));
  }
}
