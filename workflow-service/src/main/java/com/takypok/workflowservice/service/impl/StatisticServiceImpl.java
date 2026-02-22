package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.OverviewStatisticRequest;
import com.takypok.workflowservice.model.response.OverviewStatistic;
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
  public Mono<List<OverviewStatistic>> overview(OverviewStatisticRequest request) {
    return ticketRepository.overviewStatistic(request.getFrom(), request.getTo()).collectList();
  }
}
