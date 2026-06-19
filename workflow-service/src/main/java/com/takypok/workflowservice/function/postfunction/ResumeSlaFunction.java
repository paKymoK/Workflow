package com.takypok.workflowservice.function.postfunction;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
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
 * Post-function that resumes the resolution SLA clock when a ticket leaves an on-hold state (e.g.
 * Incident "Pending" -> "In Progress"/"Resolved"). Closes the open paused range by stamping {@code
 * resumeTime}. Tolerant by design: if the SLA is not currently paused, it is left untouched rather
 * than failing the transition.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResumeSlaFunction implements PostFunctionInterface {

  private final SlaRepository slaRepository;

  @Override
  public Mono<Ticket<TicketDetail>> run(
      Ticket<TicketDetail> ticket, User currentUser, Transition transition) {
    return slaRepository
        .findByTicketId(ticket.getId())
        .flatMap(
            sla -> {
              ListPausedTime pausedTimes = sla.getPausedTime();
              if (pausedTimes == null || !isPaused(pausedTimes)) {
                log.warn("SLA for ticket {} is not paused, skipping resume", ticket.getId());
                return Mono.just(sla);
              }
              pausedTimes.stream()
                  .filter(p -> Objects.isNull(p.getResumeTime()))
                  .forEach(p -> p.setResumeTime(ZonedDateTime.now()));
              sla.setPausedTime(pausedTimes);
              sla.setIsPaused(Boolean.FALSE);
              return slaRepository.save(sla);
            })
        .thenReturn(ticket)
        .switchIfEmpty(Mono.just(ticket));
  }

  private boolean isPaused(ListPausedTime pausedTimes) {
    return pausedTimes.stream().anyMatch(p -> Objects.isNull(p.getResumeTime()));
  }
}
