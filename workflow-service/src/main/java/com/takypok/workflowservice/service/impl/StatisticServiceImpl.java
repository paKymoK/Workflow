package com.takypok.workflowservice.service.impl;

import com.takypok.workflowservice.model.request.OverviewStatisticRequest;
import com.takypok.workflowservice.model.response.OverviewStatistic;
import com.takypok.workflowservice.service.StatisticService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatisticServiceImpl implements StatisticService {

  @Override
  public Mono<List<OverviewStatistic>> overview(OverviewStatisticRequest request) {
    List<OverviewStatistic> test = new ArrayList<>();
    test.add(new OverviewStatistic("Test 1", 100L));
    test.add(new OverviewStatistic("Test 2", 200L));
    return Mono.just(test);
  }
}
