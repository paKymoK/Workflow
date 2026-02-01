package com.takypok.workflowservice.scheduler;

import lombok.RequiredArgsConstructor;
import org.quartz.JobExecutionContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;

@Component
@RequiredArgsConstructor
public class SlaJob extends CoreJob {
  private final Sinks.Many<String> sink;

  @Override
  public void execute(JobExecutionContext context) {
    sink.tryEmitNext("Test");
  }
}
