package com.takypok.workflowservice.function.postfunction;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.LinkedTicket;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.ListLinkedTickets;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.enums.LinkType;
import com.takypok.workflowservice.model.request.TransitionRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Post-function for the Root Cause Found -> Known Error transition. Stamps the workaround note onto
 * the ticket detail and records any linked incident ticket IDs (default type CAUSED_BY) into
 * linkedTickets.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecordKnownErrorFunction implements PostFunctionInterface {

  @Override
  public Mono<Ticket<TicketDetail>> run(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {

    ListLinkedTickets links = ticket.getLinkedTickets();
    if (links == null) {
      links = new ListLinkedTickets();
    }

    List<Long> ids = request.getLinkedTicketIds();
    if (ids != null && !ids.isEmpty()) {
      LinkType type =
          request.getLinkedTicketType() != null
              ? request.getLinkedTicketType()
              : LinkType.CAUSED_BY;
      for (Long id : ids) {
        links.add(new LinkedTicket(id, type));
      }
    }

    ticket.setLinkedTickets(links);
    return Mono.just(ticket);
  }
}
