package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.request.OverviewStatisticRequest;
import com.takypok.workflowservice.model.response.OverviewStatistic;
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
  public Mono<ResultMessage<List<OverviewStatistic>>> get(@Valid OverviewStatisticRequest request) {
    return statisticService.overview(request).map(ResultMessage::success);
  }
}
