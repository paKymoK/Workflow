package com.takypok.workflowservice.function.postfunction;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.PausedTime;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.ListPausedTime;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.repository.SlaRepository;
import java.time.ZonedDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Post-function that pauses the resolution SLA clock when a ticket enters an on-hold state (e.g.
 * Incident "Pending"). Reuses the existing {@code paused_time} mechanism so {@code
 * calculate_office_time} subtracts the paused range. Tolerant by design: if the SLA is already
 * paused, it is left untouched rather than failing the transition.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PauseSlaFunction implements PostFunctionInterface {

  private final SlaRepository slaRepository;

  @Override
  public Mono<Ticket<TicketDetail>> run(
      Ticket<TicketDetail> ticket, User currentUser, Transition transition) {
    return slaRepository
        .findByTicketId(ticket.getId())
        .flatMap(
            sla -> {
              ListPausedTime pausedTimes = sla.getPausedTime();
              if (pausedTimes == null) {
                pausedTimes = new ListPausedTime();
              }
              if (isPaused(pausedTimes)) {
                log.warn("SLA for ticket {} already paused, skipping pause", ticket.getId());
                return Mono.just(sla);
              }
              pausedTimes.add(new PausedTime(ZonedDateTime.now()));
              sla.setPausedTime(pausedTimes);
              sla.setIsPaused(Boolean.TRUE);
              return slaRepository.save(sla);
            })
        .thenReturn(ticket)
        .switchIfEmpty(Mono.just(ticket));
  }

  private boolean isPaused(ListPausedTime pausedTimes) {
    return pausedTimes.stream().anyMatch(p -> Objects.isNull(p.getResumeTime()));
  }
}
