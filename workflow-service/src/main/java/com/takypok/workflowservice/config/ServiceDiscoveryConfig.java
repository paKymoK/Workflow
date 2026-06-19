package com.takypok.workflowservice.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ServiceDiscoveryConfig {

  @Bean("lbWebClientBuilder")
  @LoadBalanced
  public WebClient.Builder lbWebClientBuilder() {
    return WebClient.builder();
  }
}
