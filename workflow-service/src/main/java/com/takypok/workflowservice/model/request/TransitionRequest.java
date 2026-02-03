package com.takypok.workflowservice.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class TransitionRequest {
  @NotNull private Long ticketId;
  @NotNull private Long currentStatusId;
  @NotBlank private String transitionName;
}
