package com.takypok.workflowservice.model.ticket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentRef {
  private String id;
  private String name;
  private String extension;
}
