package com.takypok.gatewayservice.controller;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class DefaultController {

  @GetMapping("/")
  public Mono<Void> defaultPage(
      @RegisteredOAuth2AuthorizedClient(registrationId = "gateway-service-oidc")
          ServerHttpResponse response) {
    response.setStatusCode(HttpStatus.PERMANENT_REDIRECT);
    response.getHeaders().setLocation(URI.create("/index"));
    return response.setComplete();
  }

  @GetMapping("/index")
  public Mono<String> indexPage(
      @RegisteredOAuth2AuthorizedClient(registrationId = "gateway-service-oidc")
          OAuth2AuthorizedClient client) {
    System.out.println("->> Index");
    System.out.println(client.getAccessToken().getTokenValue());
    return Mono.just(client.getAccessToken().getTokenValue());
  }
}
