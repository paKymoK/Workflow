package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.ContractType;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContractCreateRequest {
  @NotNull private ContractType contractType;
  @NotNull private LocalDate startDate;
  private LocalDate endDate;
  private LocalDate signedDate;
  private LocalDate probationEndDate;
  private BigDecimal compensation;
  private String documentUrl;
}
