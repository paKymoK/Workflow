package com.takypok.workflowservice.model.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum StatusSla {
  TODO("To Do"),
  DONE("Done");

  private final String displayName;
}
