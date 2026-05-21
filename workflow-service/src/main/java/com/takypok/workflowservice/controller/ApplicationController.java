package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.model.annotation.IssueTypeAnnotation;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/application")
public class ApplicationController {
  private final Set<Class<? extends TicketDetail>> configTicket;

  @GetMapping
  public Mono<ResultMessage<List<String>>> getApplications() {
    List<String> applications =
        configTicket.stream()
            .map(c -> c.getAnnotation(IssueTypeAnnotation.class).value())
            .sorted()
            .toList();
    return Mono.just(ResultMessage.success(applications));
  }
}
