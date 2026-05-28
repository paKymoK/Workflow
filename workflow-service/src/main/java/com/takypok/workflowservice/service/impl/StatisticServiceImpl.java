package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.StatisticRequest;
import com.takypok.workflowservice.model.response.ApplicationTicketStatistic;
import com.takypok.workflowservice.model.response.SlaOverviewStatistic;
import com.takypok.workflowservice.model.response.SlaPriorityDistribution;
import com.takypok.workflowservice.model.response.SlaStatusDistribution;
import com.takypok.workflowservice.model.response.TicketByIssueTypeStatistic;
import com.takypok.workflowservice.model.response.TicketByProjectStatistic;
import com.takypok.workflowservice.model.response.TicketByStatusStatistic;
import com.takypok.workflowservice.repository.SlaRepository;
import com.takypok.workflowservice.repository.TicketRepository;
import com.takypok.workflowservice.service.StatisticService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatisticServiceImpl implements StatisticService {
  private final TicketRepository<TicketDetail> ticketRepository;
  private final SlaRepository slaRepository;

  @Override
  public Mono<List<TicketByStatusStatistic>> ticketByStatus(StatisticRequest request) {
    return ticketRepository
        .ticketByStatusStatistic(request.getFrom(), request.getTo())
        .collectList();
  }

  @Override
  public Mono<List<TicketByIssueTypeStatistic>> ticketByIssueType(StatisticRequest request) {
    return ticketRepository
        .ticketByIssueTypeStatistic(request.getFrom(), request.getTo())
        .collectList();
  }

  @Override
  public Mono<List<TicketByProjectStatistic>> ticketByProject(StatisticRequest request) {
    return ticketRepository
        .ticketByProjectStatistic(request.getFrom(), request.getTo())
        .collectList();
  }

  @Override
  public Mono<SlaOverviewStatistic> slaOverview(StatisticRequest request) {
    return slaRepository.getSlaOverview(request.getFrom(), request.getTo());
  }

  @Override
  public Mono<List<SlaStatusDistribution>> slaByStatusDistribution(StatisticRequest request) {
    return slaRepository
        .getSlaByStatusDistribution(request.getFrom(), request.getTo())
        .collectList();
  }

  @Override
  public Mono<List<SlaPriorityDistribution>> slaByPriorityDistribution(StatisticRequest request) {
    return slaRepository
        .getSlaByPriorityDistribution(request.getFrom(), request.getTo())
        .collectList();
  }

  @Override
  public Mono<List<ApplicationTicketStatistic>> ticketByApplication(StatisticRequest request) {
    return ticketRepository
        .ticketByApplicationStatistic(request.getFrom(), request.getTo())
        .collectList();
  }
}
