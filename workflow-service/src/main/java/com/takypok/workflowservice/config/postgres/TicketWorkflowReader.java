package com.takypok.workflowservice.config.postgres;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.model.entity.Workflow;
import io.r2dbc.postgresql.codec.Json;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.lang.NonNull;

@Slf4j
@ReadingConverter
@RequiredArgsConstructor
public class TicketWorkflowReader implements Converter<Json, Workflow> {
  private final ObjectMapper objectMapper;

  @Override
  public Workflow convert(@NonNull Json source) {
    final JsonNode tree = readTree(source);
    try {
      return objectMapper.convertValue(tree, new TypeReference<>() {});
    } catch (Exception ex) {
      return null;
    }
  }

  private JsonNode readTree(Json source) {
    try {
      return objectMapper.readTree(source.asArray());
    } catch (IOException e) {
      log.error("An error occurred while trying to read tree: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
    }
  }
}
