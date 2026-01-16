package com.takypok.gatewayservice.controller;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class DefaultController {

  @Value("${app.base-uri}")
  private String appBaseUri;

  @GetMapping("/")
  public Mono<Void> defaultPage(
      @RegisteredOAuth2AuthorizedClient(registrationId = "gateway-service-oidc")
          OAuth2AuthorizedClient client,
      ServerHttpResponse response) {
    System.out.println("->> Index");
    System.out.println(client.getAccessToken().getTokenValue());
    response.setStatusCode(HttpStatus.PERMANENT_REDIRECT);
    response.getHeaders().setLocation(URI.create(appBaseUri));
    return response.setComplete();
  }

  @GetMapping("/index")
  public Mono<Void> indexPage(
      @RegisteredOAuth2AuthorizedClient(registrationId = "gateway-service-oidc")
          OAuth2AuthorizedClient client,
      @AuthenticationPrincipal Jwt jwt,
      ServerHttpResponse response) {
    System.out.println("->> Index");
    System.out.println(jwt.getClaims());
    System.out.println(client.getAccessToken());
    response.setStatusCode(HttpStatus.PERMANENT_REDIRECT);
    response.getHeaders().setLocation(URI.create(appBaseUri));
    return response.setComplete();
  }

  @GetMapping("/authorized")
  public Mono<Void> authorized(
      @RegisteredOAuth2AuthorizedClient(registrationId = "gateway-service-oidc")
          OAuth2AuthorizedClient client,
      ServerHttpResponse response) {
    System.out.println("->> Authorized");
    System.out.println(client.getAccessToken().getTokenValue());
    client.getAccessToken().getScopes().forEach(System.out::println);
    response.setStatusCode(HttpStatus.PERMANENT_REDIRECT);
    response.getHeaders().setLocation(URI.create(appBaseUri));
    return response.setComplete();
  }
}
