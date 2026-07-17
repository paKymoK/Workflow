package com.takypok.employeeservice.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OrgChartNode {
  private Long id;
  private String employeeCode;
  private String name;
  private String title;

  /** True for the immediate manager of the employee the chart was requested for. */
  private boolean isManager;

  /** True for the employee the chart was requested for. */
  private boolean isSelf;
}
