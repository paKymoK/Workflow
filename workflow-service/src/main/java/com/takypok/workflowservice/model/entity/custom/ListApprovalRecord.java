package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.entity.ApprovalRecord;
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
public class ListApprovalRecord extends ArrayList<ApprovalRecord> {
  public ListApprovalRecord(List<ApprovalRecord> list) {
    this.addAll(list);
  }
}
