package com.takypok.workflowservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.config.postgres.*;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.PostgresDialect;

@Configuration
@Slf4j
@RequiredArgsConstructor
public class ConfigPostgres {
  public static final String CLAZZ_NAME = "_clazz";
  private final ObjectMapper mapper;

  @Bean
  public R2dbcCustomConversions customConversions() {
    List<Converter<?, ?>> converters = new ArrayList<>();
    converters.add(new WorkflowStatusReader(mapper));
    converters.add(new WorkflowStatusWriter(mapper));
    converters.add(new WorkflowTransitionReader(mapper));
    converters.add(new WorkflowTransitionWriter(mapper));
    converters.add(new IssueTypeReader(mapper));
    converters.add(new IssueTypeWriter(mapper));
    converters.add(new TicketDetailReader(mapper));
    converters.add(new TicketDetailWriter(mapper));
    converters.add(new TicketTypeReader(mapper));
    converters.add(new TicketTypeWriter(mapper));
    converters.add(new TicketWorkflowReader(mapper));
    converters.add(new TicketWorkflowWriter(mapper));
    converters.add(new UserReader(mapper));
    converters.add(new UserWriter(mapper));
    return R2dbcCustomConversions.of(PostgresDialect.INSTANCE, converters);
  }
}
