package com.takypok.workflowservice.model.entity;

import com.takypok.workflowservice.model.enums.LinkType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LinkedTicket {
  private Long ticketId;
  private LinkType type;
}
