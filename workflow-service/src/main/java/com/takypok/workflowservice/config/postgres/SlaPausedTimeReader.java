package com.takypok.workflowservice.config.postgres;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.model.entity.custom.ListPausedTime;
import io.r2dbc.postgresql.codec.Json;
import java.io.IOException;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

@Slf4j
@ReadingConverter
@RequiredArgsConstructor
public class SlaPausedTimeReader implements Converter<Json, ListPausedTime> {
  private final ObjectMapper objectMapper;

  @Override
  public ListPausedTime convert(@NonNull Json source) {
    final JsonNode tree = readTree(source);
    try {
      return objectMapper.convertValue(tree, ListPausedTime.class);
    } catch (Exception ex) {
      ex.printStackTrace();
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
