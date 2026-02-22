package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.StatisticRequest;
import com.takypok.workflowservice.model.response.TicketByIssueTypeStatistic;
import com.takypok.workflowservice.model.response.TicketByStatusStatistic;
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
}
