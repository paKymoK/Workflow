package com.takypok.workflowservice.model.request;

import com.takypok.workflowservice.model.entity.WorkflowNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class WorkflowUpdateRequest {
  @NotNull private Long id;
  @NotNull private String name;
  @NotEmpty private List<@Valid WorkflowNode> statuses;
  @NotEmpty private List<@Valid WorkflowTransitionRequest> transitions;
}
