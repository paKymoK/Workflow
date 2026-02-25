package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.request.StatisticRequest;
import com.takypok.workflowservice.model.response.SlaPriorityDistribution;
import com.takypok.workflowservice.model.response.SlaStatusDistribution;
import com.takypok.workflowservice.model.response.TicketByIssueTypeStatistic;
import com.takypok.workflowservice.model.response.TicketByStatusStatistic;
import java.util.List;
import reactor.core.publisher.Mono;

public interface StatisticService {
  Mono<List<TicketByStatusStatistic>> ticketByStatus(StatisticRequest request);

  Mono<List<TicketByIssueTypeStatistic>> ticketByIssueType(StatisticRequest request);

  Mono<List<SlaStatusDistribution>> slaByStatusDistribution(StatisticRequest request);

  Mono<List<SlaPriorityDistribution>> slaByPriorityDistribution(StatisticRequest request);
}
