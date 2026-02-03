package com.takypok.gatewayservice.authentication;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.Arrays;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
@Slf4j
public class AuthenticationConfig {
  private final ServerOAuth2AuthorizedClientRepository authorizedClientRepository;

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
        .cors(corsSpec -> corsSpec.configurationSource(corsFilter()))
        .authorizeExchange(
            exchanges ->
                exchanges
                    .pathMatchers("/", "/login/**", "/logout/**")
                    .permitAll()
                    .anyExchange()
                    .authenticated())
        .oauth2Login(withDefaults())
        .oauth2Client(withDefaults())
        .logout(withDefaults())
        .build();
  }

  @Bean
  public GlobalFilter customFilter() {
    return new CustomGlobalFilter(authorizedClientRepository);
  }

  public UrlBasedCorsConfigurationSource corsFilter() {
    final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    final CorsConfiguration config = new CorsConfiguration();
    config.setAllowedHeaders(Collections.singletonList("*"));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));
    config.setAllowedOriginPatterns(Collections.singletonList("*"));
    config.setAllowCredentials(true);
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
