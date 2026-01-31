package com.takypok.workflowservice.config.postgres;

import static com.takypok.workflowservice.config.PostgresConfig.CLAZZ_NAME;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
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
public class TicketDetailReader implements Converter<Json, TicketDetail> {
  private final ObjectMapper objectMapper;

  @Override
  public TicketDetail convert(@NonNull Json source) {
    final JsonNode tree = readTree(source);
    final Class<? extends TicketDetail> dataClass = resolveTicketDetailClass(tree);
    objectMapper.registerModule(new JavaTimeModule());
    try {
      return objectMapper.convertValue(tree, dataClass);
    } catch (Exception ex) {
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  private Class<? extends TicketDetail> resolveTicketDetailClass(JsonNode jsonNode) {
    try {
      return (Class<? extends TicketDetail>) Class.forName(jsonNode.path(CLAZZ_NAME).asText());
    } catch (ClassNotFoundException e) {
      log.error("Unable to resolve TicketDetail class: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
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
