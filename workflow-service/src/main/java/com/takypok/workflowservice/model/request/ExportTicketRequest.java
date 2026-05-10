package com.takypok.workflowservice.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ExportTicketRequest {

  @Size(max = 255)
  private String summary;

  @Min(1)
  private Long statusId;

  @Min(1)
  private Long priorityId;

  @Email
  @Size(max = 254)
  private String assigneeEmail;
}
