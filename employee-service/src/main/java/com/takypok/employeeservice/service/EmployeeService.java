package com.takypok.employeeservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.model.request.CreateEmployeeRequest;
import com.takypok.employeeservice.model.request.FilterEmployeeRequest;
import com.takypok.employeeservice.model.request.ManagerUpdateRequest;
import com.takypok.employeeservice.model.request.StatusUpdateRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import com.takypok.employeeservice.model.response.OrgChartResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EmployeeService {
  Mono<EmployeeResponse> create(CreateEmployeeRequest request);

  Mono<PageResponse<EmployeeResponse>> list(FilterEmployeeRequest request);

  Mono<EmployeeResponse> getById(Long id);

  Mono<EmployeeResponse> getBySub(String sub);

  Mono<EmployeeResponse> update(Long id, UpdateEmployeeRequest request);

  Mono<EmployeeResponse> updateStatus(Long id, StatusUpdateRequest request);

  Mono<EmployeeResponse> updateManager(Long id, ManagerUpdateRequest request);

  Mono<OrgChartResponse> getOrgChart(Long id);

  Flux<EmployeeResponse> getReports(Long id);
}
