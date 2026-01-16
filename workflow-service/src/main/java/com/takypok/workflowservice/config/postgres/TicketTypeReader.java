package com.takypok.workflowservice.config.postgres;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.model.entity.TicketType;
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
public class TicketTypeReader implements Converter<Json, TicketType> {
  private final ObjectMapper objectMapper;

  @Override
  public TicketType convert(@NonNull Json source) {
    final JsonNode tree = readTree(source);
    try {
      return objectMapper.convertValue(tree, TicketType.class);
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
