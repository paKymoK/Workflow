package com.takypok.gatewayservice.authentication.model;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import reactor.core.publisher.Mono;

public class JwtAuthenticationManager implements ReactiveAuthenticationManager {

  private final CustomReactiveUserDetailsService reactiveUserDetailsService;

  public JwtAuthenticationManager(CustomReactiveUserDetailsService reactiveUserDetailsService) {
    this.reactiveUserDetailsService = reactiveUserDetailsService;
  }

  @Override
  public Mono<Authentication> authenticate(Authentication authentication) {
    final CustomAuthentication customAuthentication = (CustomAuthentication) authentication;

    return reactiveUserDetailsService
        .findByUser(customAuthentication.getDetails())
        .map(
            userDetails ->
                new PreAuthenticatedAuthenticationToken(
                    userDetails, authentication.getCredentials(), authentication.getAuthorities()));
  }
}
