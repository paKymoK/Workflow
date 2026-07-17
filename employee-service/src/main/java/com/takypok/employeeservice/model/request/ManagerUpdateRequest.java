package com.takypok.employeeservice.model.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ManagerUpdateRequest {
  /** Null clears the manager, putting this employee at the top of its chain. */
  private Long managerId;
}
