package com.takypok.employeeservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.model.request.FilterEmployeeRequest;
import com.takypok.employeeservice.model.request.ManagerUpdateRequest;
import com.takypok.employeeservice.model.request.StatusUpdateRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import com.takypok.employeeservice.model.response.OrgChartResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EmployeeService {
  Mono<PageResponse<EmployeeResponse>> list(FilterEmployeeRequest request);

  Mono<EmployeeResponse> getBySub(String sub);

  Mono<EmployeeResponse> update(String sub, UpdateEmployeeRequest request);

  Mono<EmployeeResponse> updateStatus(String sub, StatusUpdateRequest request);

  Mono<EmployeeResponse> updateManager(String sub, ManagerUpdateRequest request);

  Mono<EmployeeResponse> updateAvatar(String sub, String avatarUrl);

  Mono<OrgChartResponse> getOrgChart(String sub);

  Flux<EmployeeResponse> getReports(String sub);
}
