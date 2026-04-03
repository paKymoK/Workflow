package com.takypok.chatservice.controller;

import com.takypok.chatservice.model.AnswerResponse;
import com.takypok.chatservice.model.QuestionRequest;
import com.takypok.chatservice.service.AssistantService;
import com.takypok.chatservice.service.IngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assist")
@RequiredArgsConstructor
public class AssistantController {

  private final AssistantService assistantService;
  private final IngestionService ingestionService;

  @PostMapping("/ask")
  public ResponseEntity<AnswerResponse> ask(@RequestBody QuestionRequest request) {
    return ResponseEntity.ok(assistantService.ask(request.getQuestion()));
  }

  @PostMapping("/ingest")
  public ResponseEntity<String> ingest(@RequestParam String folder) {
    ingestionService.ingestFolder(folder);
    return ResponseEntity.ok("Ingestion complete");
  }

  @GetMapping("/health")
  public ResponseEntity<String> health() {
    return ResponseEntity.ok("OK");
  }
}
