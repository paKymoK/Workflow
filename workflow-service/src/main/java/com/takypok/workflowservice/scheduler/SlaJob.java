package com.takypok.workflowservice.scheduler;

import lombok.RequiredArgsConstructor;
import org.quartz.JobExecutionContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;

@Component
@RequiredArgsConstructor
public class SlaJob extends CoreJob {

  @Override
  public void execute(JobExecutionContext context) {
    //TODO: do something here
  }
}
