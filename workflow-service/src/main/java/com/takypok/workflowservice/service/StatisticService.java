package com.takypok.workflowservice.service;

import com.takypok.workflowservice.model.request.OverviewStatisticRequest;
import com.takypok.workflowservice.model.response.OverviewStatistic;
import java.util.List;
import reactor.core.publisher.Mono;

public interface StatisticService {
  Mono<List<OverviewStatistic>> overview(OverviewStatisticRequest request);
}
