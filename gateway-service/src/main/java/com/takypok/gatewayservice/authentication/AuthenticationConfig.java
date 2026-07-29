package com.takypok.gatewayservice.authentication;

import java.util.Arrays;
import java.util.Collections;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.autoconfigure.security.reactive.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
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
  @Order(0)
  public SecurityWebFilterChain actuatorSecurityWebFilterChain(ServerHttpSecurity http) {
    return http.securityMatcher(EndpointRequest.toAnyEndpoint())
        .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .build();
  }

  @Bean
  @Order(1)
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
        .cors(corsSpec -> corsSpec.configurationSource(corsFilter()))
        .authorizeExchange(
            exchanges ->
                exchanges
                    .pathMatchers(
                        "/workflow-service/web-socket/**",
                        "/chat-service/web-socket/**",
                        "/media-service/images/**",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/webjars/**",
                        "/v3/api-docs/**",
                        "/*/docs/api-docs",
                        "/api/health",
                        "/api/health/**")
                    .permitAll()
                    // HLS playback only (master.m3u8/playlist/segment GETs) — players can't attach
                    // an Authorization header. Upload/delete on the same /media-service/v1/videos
                    // prefix are POST/DELETE and must fall through to .authenticated() below.
                    .pathMatchers(HttpMethod.GET, "/media-service/v1/videos/**")
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
