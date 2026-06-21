package com.takypok.workflowservice.model.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.takypok.workflowservice.model.enums.LinkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
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
  @NotNull private Long priorityId;
  private JsonNode detail;
  private List<Long> linkedTicketIds;
  private LinkType linkedTicketType;
}
