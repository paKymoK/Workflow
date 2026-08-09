package com.takypok.chatservice.model;

import lombok.Data;

/**
 * Optional single-file target. When fileName is blank/absent, the full folder is re-ingested
 * (existing wipe-and-reload behavior).
 */
@Data
public class IngestRequest {
  private String fileName;
}
