package com.takypok.workflowservice.service.impl;

import static com.takypok.core.model.Message.Application.WORKFLOW_TRANSITION_VALIDATION_FAILED;
import static com.takypok.core.model.Message.Application.WORKFLOW_VALIDATION_FAILED;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunction;
import com.takypok.workflowservice.function.validator.index.Validator;
import com.takypok.workflowservice.model.entity.IssueType;
import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.TicketType;
import com.takypok.workflowservice.model.entity.Transition;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.repository.TicketRepository;
import com.takypok.workflowservice.repository.WorkflowRepository;
import com.takypok.workflowservice.service.TicketService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl<T extends TicketDetail> implements TicketService<T> {
  private final TicketRepository<T> ticketRepository;
  private final TicketRepository<TicketDetail> ticketGenericRepository;
  private final WorkflowRepository workflowRepository;
  private final PostFunction postFunction;
  private final Validator validator;

  @Override
  public Mono<Ticket<T>> get(Long id) {
    return ticketRepository.findById(id);
  }

  @Override
  public Mono<Ticket<T>> create(Ticket<T> ticket) {

    return workflowRepository
        .findById(1L)
        .flatMap(
            workflow -> {
              ticket.setTicketType(new TicketType("test", "test"));
              ticket.setWorkflow(workflow);
              ticket.setIssueType(new IssueType("test", "test", 1L));
              ticket.setStatus("test");
              ticket.setReporter(new User());
              return ticketRepository.save(ticket);
            });
  }

  @Override
  public Mono<Ticket<TicketDetail>> transition(TransitionRequest request) {
    return ticketGenericRepository
        .findById(request.getTicketId())
        .flatMap(
            ticket -> {
              // TODO: Validate transition here
              List<Transition> lstTransition =
                  ticket.getWorkflow().getTransitions().stream()
                      .filter(
                          transition -> request.getTransitionName().equals(transition.getName()))
                      .toList();
              if (lstTransition.isEmpty()) {
                return Mono.error(
                    new ApplicationException(
                        WORKFLOW_TRANSITION_VALIDATION_FAILED, "Transition is unavailable !"));
              } else {
                return Mono.just(Tuples.of(ticket, lstTransition.get(0)));
              }
            })
        .flatMap(
            tuples ->
                initValidator(tuples.getT1(), tuples.getT2().getValidator())
                    .then(initPostFunction(tuples.getT1(), tuples.getT2().getPostFunctions())))
        .then(Mono.empty());
  }

  private Mono<Void> initValidator(Ticket<TicketDetail> ticket, List<String> function) {
    return Flux.fromIterable(function)
        .flatMap(
            s ->
                validator
                    .validate(s, ticket)
                    .flatMap(
                        result -> {
                          if (!result) {
                            return Mono.error(
                                new ApplicationException(
                                    WORKFLOW_VALIDATION_FAILED, validator.getFailedMessage(s)));
                          }
                          return Mono.empty();
                        }))
        .then();
  }

  private Mono<Void> initPostFunction(Ticket<TicketDetail> ticket, List<String> function) {
    return Flux.fromIterable(function).concatMap(s -> postFunction.apply(s, ticket)).then();
  }
}
