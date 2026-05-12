package com.takypok.mediaservice.config;

import com.takypok.mediaservice.client.UserClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.reactive.ReactorLoadBalancerExchangeFilterFunction;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@RequiredArgsConstructor
public class UserClientConfig {
  private final ReactorLoadBalancerExchangeFilterFunction lbFunction;

  @Bean
  public UserClient userClient(
      @Value("${auth.service.url:http://auth-service}") String authServiceUrl) {
    WebClient webClient = WebClient.builder().filter(lbFunction).baseUrl(authServiceUrl).build();
    return new UserClient(webClient);
  }
}
