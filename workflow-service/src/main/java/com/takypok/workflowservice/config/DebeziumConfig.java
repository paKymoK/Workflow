package com.takypok.workflowservice.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.workflowservice.model.debezium.ChangeData;
import com.takypok.workflowservice.model.debezium.SlaTracker;
import io.debezium.engine.ChangeEvent;
import io.debezium.engine.DebeziumEngine;
import io.debezium.engine.format.JsonByteArray;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Properties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.debezium.inbound.DebeziumMessageProducer;
import org.springframework.integration.debezium.support.DebeziumHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.util.ResourceUtils;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DebeziumConfig {
  private final ObjectMapper mapper;

  @Bean
  public DebeziumEngine.Builder<ChangeEvent<byte[], byte[]>> debeziumEngineBuilder() {
    String path;
    try {
      File file = ResourceUtils.getFile("classpath:offset.dat");
      path = file.getPath();
    } catch (FileNotFoundException e) {
      throw new RuntimeException(e);
    }
    Properties props = new Properties();
    props.setProperty("name", "debezium");
    props.setProperty("connector.class", "io.debezium.connector.postgresql.PostgresConnector");
    props.setProperty("tasks.max", "1");
    props.setProperty("offset.storage", "org.apache.kafka.connect.storage.FileOffsetBackingStore");
    props.setProperty("offset.storage.file.filename", path);
    props.setProperty("offset.flush.interval.ms", "60000");

    props.setProperty("database.server.name", "Workflow");
    props.setProperty("topic.prefix", "topix");
    props.setProperty("database.hostname", "127.0.0.1");
    props.setProperty("database.port", "5432");
    props.setProperty("database.user", "postgres");
    props.setProperty("database.password", "postgres");
    props.setProperty("database.dbname", "workflow");
    props.setProperty("snapshot.mode", "initial");
    props.setProperty("plugin.name", "pgoutput");
    props.setProperty("publication.autocreate.mode", "all_tables");

    props.setProperty("schema.include.list", "public");
    props.setProperty("table.include.list", "public.sla");
    props.setProperty("heartbeat.interval.ms", "30000");

    return DebeziumEngine.create(JsonByteArray.class).using(props).notifying(System.out::println);
  }

  @Bean
  public MessageChannel debeziumInputChannel() {
    return new DirectChannel();
  }

  @Bean
  public MessageProducer debeziumMessageProducer(
      DebeziumEngine.Builder<ChangeEvent<byte[], byte[]>> debeziumEngineBuilder,
      MessageChannel debeziumInputChannel) {

    DebeziumMessageProducer debeziumMessageProducer =
        new DebeziumMessageProducer(debeziumEngineBuilder);
    debeziumMessageProducer.setOutputChannel(debeziumInputChannel);
    return debeziumMessageProducer;
  }

  @ServiceActivator(inputChannel = "debeziumInputChannel")
  public void handler(Message<byte[]> message) {
    Object destination = message.getHeaders().get(DebeziumHeaders.DESTINATION);
    if ("topix.public.sla".equals(destination)) {
      try {
        ChangeData<SlaTracker> change =
            mapper.readValue(message.getPayload(), new TypeReference<>() {});

        //        System.out.println("Before: " + change.getPayload().getBefore());
        //        System.out.println("After: " + change.getPayload().getAfter());
      } catch (Exception e) {
        log.error("Sla Debezium convert error: ", e);
      }
    }
  }
}
