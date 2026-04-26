package com.takypok.gatewayservice.authentication;

import java.util.Arrays;
import java.util.Collections;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
@Slf4j
public class AuthenticationConfig {

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
        .cors(corsSpec -> corsSpec.configurationSource(corsFilter()))
        .authorizeExchange(
            exchanges ->
                exchanges
                    .pathMatchers(
                        "/workflow-service/web-socket/**",
                        "/media-service/images/**",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/webjars/**",
                        "/v3/api-docs/**",
                        "/*/docs/api-docs",
                        "/api/health",
                        "/api/health/**",
                        "/shop-service/v1/payment/vnpay-ipn",
                        "/shop-service/v1/payment/vnpay-return",
                        "/shop-service/v1/payment/stream/**")
                    .permitAll()
                    .anyExchange()
                    .authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults -> {}))
        .build();
  }

  @Bean
  public CustomGlobalFilter customGlobalFilter() {
    return new CustomGlobalFilter();
  }

  public UrlBasedCorsConfigurationSource corsFilter() {
    final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    final CorsConfiguration config = new CorsConfiguration();
    config.setAllowedHeaders(Collections.singletonList("*"));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));
    config.setAllowedOriginPatterns(Collections.singletonList("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
