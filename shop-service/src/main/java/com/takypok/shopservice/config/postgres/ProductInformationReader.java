package com.takypok.shopservice.config.postgres;

import static com.takypok.core.util.PostgresUtil.CLAZZ_NAME;
import static com.takypok.core.util.PostgresUtil.readTree;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.takypok.shopservice.model.entity.ProductInformation;
import io.r2dbc.postgresql.codec.Json;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.lang.NonNull;

@Slf4j
@ReadingConverter
@RequiredArgsConstructor
public class ProductInformationReader implements Converter<Json, ProductInformation> {
  private final ObjectMapper objectMapper;

  @Override
  public ProductInformation convert(@NonNull Json source) {
    final JsonNode tree = readTree(source);
    final Class<? extends ProductInformation> dataClass = resolveClass(tree);
    objectMapper.registerModule(new JavaTimeModule());
    try {
      return objectMapper.convertValue(tree, dataClass);
    } catch (Exception ex) {
      log.error(ex.getMessage(), ex);
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  private Class<? extends ProductInformation> resolveClass(JsonNode jsonNode) {
    try {
      return (Class<? extends ProductInformation>) Class.forName(jsonNode.path(CLAZZ_NAME).asText());
    } catch (ClassNotFoundException e) {
      log.error("Unable to resolve ProductInformation class: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
    }
  }
}
