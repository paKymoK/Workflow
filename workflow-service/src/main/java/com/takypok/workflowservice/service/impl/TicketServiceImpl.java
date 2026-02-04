package com.takypok.workflowservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.function.postfunction.index.PostFunction;
import com.takypok.workflowservice.function.validator.index.Validator;
import com.takypok.workflowservice.model.entity.*;
import com.takypok.workflowservice.model.entity.custom.ListPausedTime;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.mapper.SlaMapper;
import com.takypok.workflowservice.model.mapper.TicketMapper;
import com.takypok.workflowservice.model.request.CreateTicketRequest;
import com.takypok.workflowservice.model.request.TransitionRequest;
import com.takypok.workflowservice.model.ticket.sla.PausedTime;
import com.takypok.workflowservice.repository.*;
import com.takypok.workflowservice.service.TicketService;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {
  private final TicketRepository<TicketDetail> ticketRepository;
  private final WorkflowRepository workflowRepository;
  private final ProjectRepository projectRepository;
  private final IssueTypeRepository issueTypeRepository;
  private final PriorityRepository priorityRepository;
  private final PostFunction postFunction;
  private final Validator validator;
  private final TicketMapper ticketMapper;
  private final SlaMapper slaMapper;
  private final SlaRepository slaRepository;

  @Override
  public Mono<List<Ticket<TicketDetail>>> get() {
    return ticketRepository.findAll().collectList();
  }

  @Override
  public Mono<List<Sla>> getSla() {
    return slaRepository.findAll().collectList();
  }

  @Override
  public Mono<Ticket<TicketDetail>> get(Long id) {
    return ticketRepository.findById(id);
  }

  @Override
  public Mono<Ticket<TicketDetail>> create(CreateTicketRequest request, User user) {
    return Mono.zip(
            getWorkflow(request.getWorkflowId()),
            getProject(request.getProjectId()),
            getIssueType(request.getIssueTypeId(), request.getProjectId()),
            getPriority(request.getPriority()))
        .flatMap(
            tuples ->
                ticketRepository.save(
                    ticketMapper.mapToTicket(
                        request,
                        tuples.getT1(),
                        tuples.getT2(),
                        tuples.getT3(),
                        tuples.getT4(),
                        user)))
        .doOnNext(
            ticket ->
                slaRepository
                    .save(slaMapper.mapToSla(ticket.getId(), ticket.getPriority()))
                    .doOnError(Throwable::printStackTrace)
                    .toFuture());
  }

  @Override
  public Mono<Sla> pause(Long id, User user) {
    return slaRepository
        .findByTicketId(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "Ticket do not exist/Ticket do not have SLA")))
        .flatMap(
            sla -> {
              ListPausedTime lstPauseTime = sla.getPausedTime();
              if (isSlaPaused(lstPauseTime)) {
                return Mono.error(
                    new ApplicationException(Message.Application.ERROR, "Sla is already paused"));

              } else {
                lstPauseTime.add(new PausedTime(ZonedDateTime.now()));
                sla.setPausedTime(lstPauseTime);
                return slaRepository.save(sla);
              }
            });
  }

  @Override
  public Mono<Sla> resume(Long id, User user) {
    return slaRepository
        .findByTicketId(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "Ticket do not exist/Ticket do not have SLA")))
        .flatMap(
            sla -> {
              ListPausedTime lstPauseTime = sla.getPausedTime();
              if (isSlaPaused(lstPauseTime)) {
                sla.setPausedTime(
                    new ListPausedTime(
                        lstPauseTime.stream()
                            .peek(
                                pausedTime -> {
                                  if (Objects.isNull(pausedTime.getResumeTime())) {
                                    pausedTime.setResumeTime(ZonedDateTime.now());
                                  }
                                })
                            .toList()));
                return slaRepository.save(sla);
              } else {
                return Mono.error(
                    new ApplicationException(Message.Application.ERROR, "Sla is not paused"));
              }
            });
  }

  private boolean isSlaPaused(ListPausedTime pausedTime) {
    AtomicBoolean result = new AtomicBoolean(false);
    pausedTime.forEach(
        pause -> {
          if (Objects.isNull(pause.getResumeTime())) {
            result.set(true);
          }
        });
    return result.get();
  }

  @Override
  public Mono<Ticket<TicketDetail>> transition(TransitionRequest request) {
    return ticketRepository
        .findById(request.getTicketId())
        .flatMap(
            ticket -> {
              // TODO: Validate transition here
              List<Transition> lstTransition =
                  ticket.getWorkflow().getTransitions().stream()
                      .filter(
                          transition ->
                              request.getTransitionName().equals(transition.getName())
                                  && request
                                      .getCurrentStatusId()
                                      .equals(transition.getFrom().getId()))
                      .toList();
              if (!Objects.equals(ticket.getStatus().getId(), request.getCurrentStatusId())) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Current Transition is not Valid "));
              }
              if (lstTransition.isEmpty()) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Transition is unavailable !"));
              } else {
                return Mono.just(Tuples.of(ticket, lstTransition.get(0)));
              }
            })
        .flatMap(
            tuples ->
                initValidator(tuples.getT1(), tuples.getT2().getValidator())
                    .then(initPostFunction(tuples.getT1(), tuples.getT2().getPostFunctions()))
                    .thenReturn(tuples))
        .flatMap(
            tuples ->
                ticketRepository.save(
                    ticketMapper.mapEntityUpdateStatus(tuples.getT1(), tuples.getT2().getTo())));
  }

  private Mono<Workflow> getWorkflow(Long workflowId) {
    return workflowRepository
        .findById(workflowId)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "Workflow not valid or exist !")));
  }

  private Mono<Project> getProject(Long projectId) {
    return projectRepository
        .findById(projectId)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "Project not valid or exist !")));
  }

  private Mono<Priority> getPriority(Long priorityId) {
    return priorityRepository
        .findById(priorityId)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "Priority not valid or exist !")));
  }

  private Mono<IssueType> getIssueType(Long issueTypeId, Long projectId) {
    return issueTypeRepository
        .findById(issueTypeId)
        .flatMap(
            issueType -> {
              if (Objects.equals(issueType.getProjectId(), projectId)) {
                return Mono.just(issueType);
              } else {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Issue Type not exist in Project !"));
              }
            })
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "Issue Type not valid or exist !")));
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
                                    Message.Application.ERROR, validator.getFailedMessage(s)));
                          }
                          return Mono.empty();
                        }))
        .then();
  }

  private Mono<Void> initPostFunction(Ticket<TicketDetail> ticket, List<String> function) {
    return Flux.fromIterable(function).concatMap(s -> postFunction.apply(s, ticket)).then();
  }
}
