package com.takypok.gatewayservice.authentication;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class CorsConfig implements WebFluxConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/**") // Apply to all endpoints
        .allowedOriginPatterns("*") // Specify allowed origins
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Specify allowed HTTP methods
        .allowedHeaders("*") // Allow all headers
        .allowCredentials(true) // Allow sending credentials (e.g., cookies)
        .maxAge(3600); // Cache preflight requests for 1 hour
  }
}
