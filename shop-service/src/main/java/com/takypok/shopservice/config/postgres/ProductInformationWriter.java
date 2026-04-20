package com.takypok.shopservice.config.postgres;

import static com.takypok.core.util.PostgresUtil.CLAZZ_NAME;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.shopservice.model.entity.ProductInformation;
import io.r2dbc.postgresql.codec.Json;
import java.io.Serial;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.lang.NonNull;

@Slf4j
@WritingConverter
@RequiredArgsConstructor
public class ProductInformationWriter implements Converter<ProductInformation, Json> {
  private final ObjectMapper objectMapper;

  @Override
  public Json convert(@NonNull ProductInformation source) {
    try {
      return Json.of(objectMapper.writeValueAsBytes(new ProcessProductInformationData(source)));
    } catch (JsonProcessingException e) {
      log.error("Unable to convert ProductInformation: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
    }
  }

  public final class ProcessProductInformationData extends HashMap<String, Object> {
    @Serial private static final long serialVersionUID = 1L;

    private ProcessProductInformationData(ProductInformation info) {
      super(objectMapper.convertValue(info, new TypeReference<Map<String, Object>>() {}));
      put(CLAZZ_NAME, info.getClass());
    }
  }
}
