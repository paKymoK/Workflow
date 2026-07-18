package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.UserSummary;
import com.takypok.workflowservice.service.EmployeeDirectoryService;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/mention")
public class MentionController {
  private final EmployeeDirectoryService employeeDirectoryService;

  @GetMapping("/search")
  public Mono<ResultMessage<List<UserSummary>>> search(@RequestParam @NotBlank String q) {
    return employeeDirectoryService.searchUsers(q).map(ResultMessage::success);
  }
}
