package com.takypok.workflowservice.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class FilterTicketRequest {
  @Min(0)
  private Long page = 0L;

  @Min(1)
  @Max(100)
  private Long size = 10L;

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
