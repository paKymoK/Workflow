package com.takypok.workflowservice.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.annotation.InternalApplicationAnnotation;
import com.takypok.workflowservice.model.entity.Project;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class ApplicationAssigneeResolver {

  private final Set<Class<? extends TicketDetail>> configTicket;
  private final AuthServiceClient authServiceClient;

  public Mono<User> resolve(JsonNode detail, Project project) {
    if (!"IA".equals(project.getCode()) || detail == null || detail.isNull()) {
      return Mono.empty();
    }
    JsonNode appNode = detail.get("application");
    if (appNode == null || appNode.asText().isBlank()) {
      return Mono.empty();
    }
    String application = appNode.asText();
    return configTicket.stream()
        .filter(
            c ->
                c.getAnnotation(InternalApplicationAnnotation.class).value().equals(application))
        .findFirst()
        .map(
            c -> {
              String sub = c.getAnnotation(InternalApplicationAnnotation.class).assignee();
              return sub.isBlank() ? Mono.<User>empty() : authServiceClient.getUser(sub);
            })
        .orElse(Mono.empty());
  }
}
