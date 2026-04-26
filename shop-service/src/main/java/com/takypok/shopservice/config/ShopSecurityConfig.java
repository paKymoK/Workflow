package com.takypok.shopservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;

@Configuration
public class ShopSecurityConfig {

  @Bean
  @Order(1)
  public SecurityWebFilterChain paymentPublicFilterChain(ServerHttpSecurity http) {
    return http.securityMatcher(
            ServerWebExchangeMatchers.pathMatchers(
                "/v1/payment/vnpay-ipn", "/v1/payment/vnpay-return", "/v1/payment/stream/**"))
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .authorizeExchange(exchange -> exchange.anyExchange().permitAll())
        .build();
  }
}
