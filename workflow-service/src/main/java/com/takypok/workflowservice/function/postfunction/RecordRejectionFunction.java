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
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordRejectionFunction implements PostFunctionInterface {

  private final WebClient.Builder webClientBuilder;

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

    String content = "[REJECTED] " + note;
    return webClientBuilder
        .build()
        .post()
        .uri("http://media-service/v1/comment")
        .bodyValue(Map.of("ticketId", ticket.getId(), "content", content))
        .retrieve()
        .bodyToMono(Void.class)
        .onErrorResume(
            ex -> {
              log.warn(
                  "media-service unavailable — rejection comment not posted for ticket {}. "
                      + "Notify the submitter manually. Error: {}",
                  ticket.getId(),
                  ex.getMessage());
              ticket.setMediaServiceWarning(
                  "Comment service unavailable — notify the submitter manually.");
              return Mono.empty();
            })
        .thenReturn(ticket);
  }
}
