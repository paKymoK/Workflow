package com.takypok.workflowservice.scheduler;

import static org.quartz.SimpleScheduleBuilder.simpleSchedule;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public abstract class CoreJob implements Job {
  @Autowired private Scheduler scheduler;

  public void scheduleJob() throws SchedulerException {
    JobDetail jobDetail = JobBuilder.newJob(getClass()).build();

    Trigger trigger =
        TriggerBuilder.newTrigger()
            .startNow()
            .withSchedule(
                simpleSchedule().repeatForever().withIntervalInSeconds(1)) // Run every 1 seconds
            .build();

    scheduler.scheduleJob(jobDetail, trigger);
  }
}
