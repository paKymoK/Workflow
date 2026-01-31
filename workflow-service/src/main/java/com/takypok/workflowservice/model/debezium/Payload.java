package com.takypok.workflowservice.model.debezium;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Payload<T> {
  private T before;
  private T after;
}
