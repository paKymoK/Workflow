package com.takypok.employeeservice.model.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OrgChartResponse {
  /** Top-of-chain first, the requested employee last. */
  private List<OrgChartNode> chain;

  private List<OrgChartNode> reports;
}
