package com.takypok.workflowservice.model.request;

import com.takypok.workflowservice.model.enums.LinkType;
import com.takypok.workflowservice.model.enums.PendingReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
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
  private String rejectionNote;
  private String workaroundNote;
  private List<Long> linkedTicketIds;
  private LinkType linkedTicketType;
}
