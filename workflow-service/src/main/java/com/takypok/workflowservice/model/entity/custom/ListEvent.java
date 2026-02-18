package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.entity.SlaEvent;
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
public class ListEvent extends ArrayList<SlaEvent> {
  public ListEvent(List<SlaEvent> lstPausedTime) {
    this.addAll(lstPausedTime);
  }
}
