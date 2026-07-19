package com.takypok.workflowservice.function.validator;

import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.validator.index.ParameterizedValidatorInterface;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Gates a transition on the caller being one of a fixed, admin-configured list of subs, passed as a
 * comma-separated descriptor argument — e.g. {@code
 * com.takypok.workflowservice.function.validator.SpecificApproverValidator#jdoe,asmith}. One bean
 * therefore serves every specific-user-gated transition, same pattern as {@link RoleValidator}.
 */
@Component
@Slf4j
public class SpecificApproverValidator implements ParameterizedValidatorInterface {

  @Override
  public Mono<Boolean> validate(
      Ticket<TicketDetail> ticket,
      User currentUser,
      Transition transition,
      TransitionRequest request,
      String arg) {
    if (arg == null || arg.isBlank()) {
      log.warn(
          "SpecificApproverValidator used without a sub list on transition '{}'",
          transition.getName());
      return Mono.just(false);
    }
    Set<String> subs =
        Arrays.stream(arg.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
    return Mono.just(currentUser != null && subs.contains(currentUser.getSub()));
  }

  @Override
  public String validateFailedMessage(String arg) {
    return "Only specific approvers can perform this transition !";
  }
}
