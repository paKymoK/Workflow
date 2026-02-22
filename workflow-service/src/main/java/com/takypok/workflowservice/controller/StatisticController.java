package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.request.StatisticRequest;
import com.takypok.workflowservice.model.response.TicketByIssueTypeStatistic;
import com.takypok.workflowservice.model.response.TicketByStatusStatistic;
import com.takypok.workflowservice.service.StatisticService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/statistic")
public class StatisticController {
  private final StatisticService statisticService;

  @GetMapping("/overview")
  public Mono<ResultMessage<List<TicketByStatusStatistic>>> ticketByStatus(
      @Valid StatisticRequest request) {
    return statisticService.ticketByStatus(request).map(ResultMessage::success);
  }

  @GetMapping("/ticket-by-issue-type")
  public Mono<ResultMessage<List<TicketByIssueTypeStatistic>>> ticketByIssueType(
      @Valid StatisticRequest request) {
    return statisticService.ticketByIssueType(request).map(ResultMessage::success);
  }
}
