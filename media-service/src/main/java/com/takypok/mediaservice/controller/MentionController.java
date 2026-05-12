package com.takypok.mediaservice.controller;

import com.takypok.core.model.UserSummary;
import com.takypok.mediaservice.client.UserClient;
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
  private final UserClient userClient;

  @GetMapping("/search")
  public Mono<List<UserSummary>> search(@RequestParam @NotBlank String q) {
    return userClient.searchUsers(q);
  }
}
