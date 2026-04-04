package com.takypok.chatservice.model;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IngestResponse {
  private List<String> ingested;
  private List<String> duplicates;
  private List<String> failed;
}
