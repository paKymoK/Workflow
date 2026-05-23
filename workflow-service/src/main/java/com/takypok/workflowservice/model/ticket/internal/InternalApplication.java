package com.takypok.workflowservice.model.ticket.internal;

import com.takypok.workflowservice.model.ticket.AttachmentRef;
import jakarta.validation.constraints.NotNull;
import java.time.ZonedDateTime;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@NoArgsConstructor
@SuperBuilder
@Getter
@Setter
public class InternalApplication {
  private String application;
  private String department;
  private String region;
  private String location;
  private String phoneNumber;

  @NotNull private String description;
  private List<AttachmentRef> attachment;
  private String relatedLink;
  private String label;
  private ZonedDateTime committedDate;
  private String involvedUser;
}
