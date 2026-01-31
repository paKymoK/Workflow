package com.takypok.workflowservice.config;

import com.takypok.workflowservice.scheduler.CoreJob;
import lombok.RequiredArgsConstructor;
import org.quartz.SchedulerException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class QuartzConfig {
  private final ApplicationContext context;

  @Bean
  public Boolean jobStart() {
    context
        .getBeansOfType(CoreJob.class)
        .forEach(
            (s, coreJob) -> {
              try {
                coreJob.scheduleJob();
              } catch (SchedulerException e) {
                throw new RuntimeException(e);
              }
            });
    return true;
  }
}
