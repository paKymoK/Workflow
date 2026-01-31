package com.takypok.workflowservice.config;

import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.ticket.annotation.IssueTypeAnnotation;
import com.takypok.workflowservice.repository.SlaRepository;
import java.time.Duration;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang.StringUtils;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicationConfig {
  private final Set<Class<? extends TicketDetail>> configTicket;
  private final ReactiveRedisOperations<String, Sla> redisSlaOps;
  private final SlaRepository slaRepository;

  @EventListener(ApplicationReadyEvent.class)
  public void onApplicationReady() {
    configTicket.forEach(
        clazz -> {
          IssueTypeAnnotation annotation = clazz.getAnnotation(IssueTypeAnnotation.class);
          if (Objects.isNull(annotation)) {
            throw new RuntimeException(
                clazz.getSimpleName() + " is not annotated with @IssueTypeAnnotation");
          } else {
            if (StringUtils.isEmpty(annotation.value())) {
              throw new RuntimeException(
                  clazz.getSimpleName() + " is not annotation @IssueTypeAnnotation value is empty");
            }
          }
        });

    System.out.println("Prepared Redis");

    redisSlaOps
        .scan(ScanOptions.scanOptions().match("SLA_*").build())
        .thenMany(
            slaRepository
                .findAll()
                .flatMap(
                    sla ->
                        redisSlaOps
                            .opsForValue()
                            .set("SLA_" + sla.getId(), sla, Duration.ofMinutes(10))))
        .onErrorMap(RuntimeException::new)
        .subscribe();
  }
}
