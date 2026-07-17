package com.takypok.employeeservice.model.mapper;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.request.CreateEmployeeRequest;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "status", constant = "ACTIVE")
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "modifiedAt", ignore = true)
  @Mapping(target = "modifiedBy", ignore = true)
  Employee toEntity(CreateEmployeeRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "sub", ignore = true)
  @Mapping(target = "employeeCode", ignore = true)
  @Mapping(target = "managerId", ignore = true)
  @Mapping(target = "status", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "modifiedAt", ignore = true)
  @Mapping(target = "modifiedBy", ignore = true)
  void updateEntity(UpdateEmployeeRequest request, @MappingTarget Employee employee);

  EmployeeResponse toResponse(Employee employee);

  default PageResponse<EmployeeResponse> toPageResponse(
      List<Employee> content, long page, long size, long totalElements) {
    List<EmployeeResponse> mapped =
        content.stream().map(this::toResponse).collect(Collectors.toList());
    long totalPages = size == 0 ? 0 : (long) Math.ceil((double) totalElements / size);
    return new PageResponse<>(mapped, page, size, totalElements, totalPages);
  }

  default EmploymentStatus defaultStatus() {
    return EmploymentStatus.ACTIVE;
  }
}
