package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.entity.Transition;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ListTransition extends ArrayList<Transition> {
  public ListTransition(List<Transition> lstTransition) {
    this.addAll(lstTransition);
  }
}
