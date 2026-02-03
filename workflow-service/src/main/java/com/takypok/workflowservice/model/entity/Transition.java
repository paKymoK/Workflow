package com.takypok.workflowservice.model.entity;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transition {
  private String name;
  private Status from;
  private Status to;
  private List<String> validator;
  private List<String> postFunctions;
}
