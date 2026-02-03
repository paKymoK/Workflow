package com.takypok.workflowservice.model.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class TransitionRequest {
  private Long ticketId;
  private String transitionName;
}
