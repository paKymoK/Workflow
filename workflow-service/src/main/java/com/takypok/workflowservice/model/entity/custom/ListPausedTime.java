package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.ticket.sla.PausedTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ListPausedTime extends ArrayList<PausedTime> {
  public ListPausedTime(List<PausedTime> lstPausedTime) {
    this.addAll(lstPausedTime);
  }
}
