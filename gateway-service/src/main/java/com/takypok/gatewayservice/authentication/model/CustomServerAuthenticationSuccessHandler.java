package com.takypok.gatewayservice.authentication.model;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import reactor.core.publisher.Mono;

public class CustomServerAuthenticationSuccessHandler
    implements ServerAuthenticationSuccessHandler {

  @Override
  public Mono<Void> onAuthenticationSuccess(
      WebFilterExchange webFilterExchange, Authentication authentication) {
    // Implement your custom logic here
    // For example, redirect to a specific page,
    // add a cookie, log user activity, etc.

    // Example: Redirect to "/dashboard"
    return Mono.fromRunnable(
        () ->
            webFilterExchange
                .getExchange()
                .getResponse()
                .getHeaders()
                .setLocation(java.net.URI.create("/index")));
  }
}
