package com.takypok.workflowservice.config.postgres;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.model.entity.custom.ListTransition;
import io.r2dbc.postgresql.codec.Json;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;

@Slf4j
@WritingConverter
@RequiredArgsConstructor
public class WorkflowTransitionWriter implements Converter<ListTransition, Json> {
  private final ObjectMapper objectMapper;

  @Override
  public Json convert(@NonNull ListTransition source) {
    try {
      return Json.of(objectMapper.writeValueAsBytes(source));
    } catch (JsonProcessingException e) {
      log.error("Unable to convert WorkflowTransition: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
    }
  }
}
