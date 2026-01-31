package com.takypok.workflowservice.model.debezium;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ChangeData<T> {
  private Payload<T> payload;
}
