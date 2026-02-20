package com.takypok.workflowservice.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class CreateTicketRequest {
  @NotBlank private String summary;
  @NotNull private Long issueTypeId;
  @NotNull private Long projectId;
  @NotNull private Long priority;
  @NotNull private Object detail;
}
