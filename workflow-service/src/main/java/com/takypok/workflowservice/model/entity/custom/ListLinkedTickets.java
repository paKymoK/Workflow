package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.entity.LinkedTicket;
import java.util.ArrayList;
import java.util.List;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@ToString
public class ListLinkedTickets extends ArrayList<LinkedTicket> {
  public ListLinkedTickets(List<LinkedTicket> list) {
    this.addAll(list);
  }
}
