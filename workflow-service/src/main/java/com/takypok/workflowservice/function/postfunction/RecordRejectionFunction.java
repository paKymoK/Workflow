package com.takypok.workflowservice.function.postfunction;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.ApprovalRecord;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.ListApprovalRecord;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.CommentRequest;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.service.CommentService;
import java.time.ZonedDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordRejectionFunction implements PostFunctionInterface {

  private final CommentService commentService;

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

    String note = request.getRejectionNote();
    if (note == null || note.isBlank()) {
      return Mono.just(ticket);
    }

    CommentRequest commentRequest = new CommentRequest();
    commentRequest.setContent("[REJECTED] " + note);
    return commentService
        .comment(ticket.getId(), commentRequest, currentUser)
        .onErrorResume(
            ex -> {
              log.warn(
                  "Failed to record rejection comment for ticket {}: {}",
                  ticket.getId(),
                  ex.getMessage());
              ticket.setCommentWarning(
                  "Comment could not be recorded — notify the submitter manually.");
              return Mono.empty();
            })
        .thenReturn(ticket);
  }
}
