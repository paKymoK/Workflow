package com.takypok.chatservice.controller;

import com.takypok.chatservice.model.AnswerResponse;
import com.takypok.chatservice.model.IngestResponse;
import com.takypok.chatservice.model.QuestionRequest;
import com.takypok.chatservice.service.AssistantService;
import com.takypok.chatservice.service.IngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/assist")
@RequiredArgsConstructor
public class AssistantController {

  private final AssistantService assistantService;
  private final IngestionService ingestionService;

  @PostMapping("/ask")
  public Mono<ResponseEntity<AnswerResponse>> ask(@RequestBody QuestionRequest request) {
    return assistantService.ask(request.getQuestion()).map(ResponseEntity::ok);
  }

  @PostMapping("/ingest")
  public Mono<ResponseEntity<IngestResponse>> ingest() {
    return ingestionService.ingestFolder().map(ResponseEntity::ok);
  }

  @GetMapping("/health")
  public Mono<ResponseEntity<String>> health() {
    return Mono.just(ResponseEntity.ok("OK"));
  }
}
