package com.takypok.workflowservice.config;

import com.takypok.workflowservice.service.SlaEventWebSocket;
import java.util.HashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;
import reactor.core.publisher.Sinks;

@Configuration
public class WebSocketConfig {

  @Bean
  public Sinks.Many<String> sink() {
    return Sinks.many().replay().latest();
  }

  @Bean
  public HandlerMapping handlerMapping(Sinks.Many<String> sink) {
    Map<String, WebSocketHandler> map = new HashMap<>();
    map.put("/web-socket/sla", new SlaEventWebSocket(sink));
    int order = 1;

    return new SimpleUrlHandlerMapping(map, order);
  }

  @Bean
  public WebSocketHandlerAdapter handlerAdapter() {
    return new WebSocketHandlerAdapter();
  }
}
