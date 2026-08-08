package com.takypok.workflowservice.function.postfunction;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.model.ticket.GenericDetail;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Increments the requester's leave balance in employee-service when their Leave Request ticket is
 * approved. This is the first synchronous cross-service call workflow-service makes (everywhere
 * else reads a local, Kafka-fed read-model like {@code employee_directory} instead) — a pragmatic
 * MVP choice; a Kafka event employee-service consumes, matching {@code
 * EmployeeDirectoryEventConsumer}'s convention, is the intended follow-up. Best-effort: a failure
 * here logs and lets the approval stand rather than failing the whole transition, since the
 * approval itself (recorded by {@link RecordApprovalFunction}) is the source of truth and the
 * balance can be reconciled after the fact.
 */
@Component
@Slf4j
public class DecrementLeaveBalanceFunction implements PostFunctionInterface {

  private final WebClient.Builder lbWebClientBuilder;

  public DecrementLeaveBalanceFunction(
      @Qualifier("lbWebClientBuilder") WebClient.Builder lbWebClientBuilder) {
    this.lbWebClientBuilder = lbWebClientBuilder;
  }

  @Override
  public Mono<Ticket<TicketDetail>> run(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request) {
    if (!(ticket.getDetail() instanceof GenericDetail detail)
        || ticket.getReporter() == null
        || ticket.getReporter().getSub() == null) {
      return Mono.just(ticket);
    }
    Map<String, Object> fields = detail.getFields();
    Object leaveType = fields.get("leaveType");
    Object days = fields.get("days");
    if (leaveType == null || !(days instanceof Number)) {
      log.warn(
          "Leave ticket {} approved with no leaveType/days in detail, skipping", ticket.getId());
      return Mono.just(ticket);
    }
    return ReactiveSecurityContextHolder.getContext()
        .map(SecurityContext::getAuthentication)
        .flatMap(
            authentication ->
                incrementBalance(
                    ((Jwt) authentication.getPrincipal()).getTokenValue(),
                    ticket.getReporter().getSub(),
                    leaveType,
                    ((Number) days).intValue()))
        .onErrorResume(
            ex -> {
              log.warn(
                  "Failed to update leave balance for ticket {}: {}",
                  ticket.getId(),
                  ex.getMessage());
              return Mono.empty();
            })
        .thenReturn(ticket);
  }

  private Mono<Void> incrementBalance(String bearerToken, String sub, Object leaveType, int days) {
    return lbWebClientBuilder
        .build()
        .patch()
        .uri("http://employee-service/v1/employees/{sub}/leave-balance/increment", sub)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
        .bodyValue(Map.of("leaveType", leaveType, "days", days))
        .retrieve()
        .toBodilessEntity()
        .then();
  }
}
