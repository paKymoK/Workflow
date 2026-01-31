package com.takypok.workflowservice.model.request;

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
public class CreateWorkflowRequest {
  @NotNull private String name;
  @NotEmpty private List<Long> statuses;
  @NotEmpty private List<@Valid CreateWorkflowTransitionRequest> transitions;
}
