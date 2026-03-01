package com.takypok.workflowservice.model.entity.custom;

import com.takypok.workflowservice.model.entity.WorkflowNode;
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
public class ListWorkflowNode extends ArrayList<WorkflowNode> {
  public ListWorkflowNode(List<WorkflowNode> lstWorkflowNode) {
    this.addAll(lstWorkflowNode);
  }
}
