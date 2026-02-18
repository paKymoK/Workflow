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
public class PostgresConfig {
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
    converters.add(new ProjectReader(mapper));
    converters.add(new ProjectWriter(mapper));
    converters.add(new TicketWorkflowReader(mapper));
    converters.add(new TicketWorkflowWriter(mapper));
    converters.add(new UserReader(mapper));
    converters.add(new UserWriter(mapper));
    converters.add(new PriorityReader(mapper));
    converters.add(new PriorityWriter(mapper));
    converters.add(new SlaPausedTimeReader(mapper));
    converters.add(new SlaPausedTimeWriter(mapper));
    converters.add(new SlaStatusReader(mapper));
    converters.add(new SlaStatusWriter(mapper));
    converters.add(new SlaSettingReader(mapper));
    converters.add(new SlaSettingWriter(mapper));
    converters.add(new SlaEventReader(mapper));
    converters.add(new SlaEventWriter(mapper));
    converters.add(new StatusReader(mapper));
    converters.add(new StatusWriter(mapper));
    converters.add(new SlaReader(mapper));
    return R2dbcCustomConversions.of(PostgresDialect.INSTANCE, converters);
  }
}
