package com.takypok.workflowservice.function.postfunction;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.ApprovalRecord;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.ListApprovalRecord;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import java.time.ZonedDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordApprovalFunction implements PostFunctionInterface {

  @Override
  public Mono<Ticket<TicketDetail>> run(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {
    ListApprovalRecord approvals = ticket.getApprovals();
    if (approvals == null) {
      approvals = new ListApprovalRecord();
    }
    approvals.add(new ApprovalRecord(transition.getName(), currentUser, ZonedDateTime.now()));
    ticket.setApprovals(approvals);
    return Mono.just(ticket);
  }
}
