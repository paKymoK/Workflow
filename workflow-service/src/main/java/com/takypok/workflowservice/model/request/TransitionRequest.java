package com.takypok.workflowservice.model.request;

import com.takypok.workflowservice.model.enums.PendingReason;
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
  private PendingReason pendingReason;
  private String pendingDescription;
}
