package com.takypok.shopservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.shopservice.config.postgres.ProductInformationReader;
import com.takypok.shopservice.config.postgres.ProductInformationWriter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.PostgresDialect;

@Configuration
@RequiredArgsConstructor
public class PostgresConfig {
  private final ObjectMapper mapper;

  @Bean
  public R2dbcCustomConversions customConversions() {
    List<Converter<?, ?>> converters = new ArrayList<>();
    converters.add(new ProductInformationReader(mapper));
    converters.add(new ProductInformationWriter(mapper));
    return R2dbcCustomConversions.of(PostgresDialect.INSTANCE, converters);
  }
}
