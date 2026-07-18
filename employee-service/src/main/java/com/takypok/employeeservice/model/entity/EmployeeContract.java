package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeContract extends IdEntity {
  private String sub;
  private ContractType contractType;
  private LocalDate startDate;
  private LocalDate endDate;
  private LocalDate signedDate;
  private LocalDate probationEndDate;
  private BigDecimal compensation;
  private ContractStatus status = ContractStatus.ACTIVE;
  private String documentUrl;
}
