package com.takypok.workflowservice.config.postgres;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.model.entity.custom.ListLinkedTickets;
import io.r2dbc.postgresql.codec.Json;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.lang.NonNull;

@Slf4j
@WritingConverter
@RequiredArgsConstructor
public class LinkedTicketWriter implements Converter<ListLinkedTickets, Json> {
  private final ObjectMapper objectMapper;

  @Override
  public Json convert(@NonNull ListLinkedTickets source) {
    try {
      return Json.of(objectMapper.writeValueAsBytes(source));
    } catch (JsonProcessingException e) {
      log.error("Unable to convert LinkedTickets: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
    }
  }
}
