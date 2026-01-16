package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.entity.Status;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ListStatus extends ArrayList<Status> {

  public ListStatus(List<Status> lstStatus) {
    this.addAll(lstStatus);
  }
}
