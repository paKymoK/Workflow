package com.takypok.employeeservice.model.mapper;

import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.request.UpdateEmployeeRequest;
import com.takypok.employeeservice.model.response.EmployeeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

  @Mapping(target = "sub", ignore = true)
  @Mapping(target = "managerSub", ignore = true)
  @Mapping(target = "status", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "modifiedAt", ignore = true)
  @Mapping(target = "modifiedBy", ignore = true)
  void updateEntity(UpdateEmployeeRequest request, @MappingTarget Employee employee);

  @Mapping(target = "departmentName", ignore = true)
  @Mapping(target = "unitName", ignore = true)
  EmployeeResponse toResponse(Employee employee);
}
