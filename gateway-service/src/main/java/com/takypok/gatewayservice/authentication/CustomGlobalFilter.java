package com.takypok.gatewayservice.authentication;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class CustomGlobalFilter implements GlobalFilter, Ordered {
  private final ServerOAuth2AuthorizedClientRepository authorizedClientRepository;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    return exchange
        .getPrincipal()
        .flatMap(
            principal -> {
              if (principal instanceof OAuth2AuthenticationToken auth) {
                return authorizedClientRepository
                    .loadAuthorizedClient(auth.getAuthorizedClientRegistrationId(), auth, exchange)
                    .cast(OAuth2AuthorizedClient.class)
                    .map(
                        client ->
                            withBearerToken(exchange, client.getAccessToken().getTokenValue()));
              } else if (principal instanceof JwtAuthenticationToken jwtAuth) {
                return Mono.just(withBearerToken(exchange, jwtAuth.getToken().getTokenValue()));
              }
              return Mono.just(exchange);
            })
        .defaultIfEmpty(exchange)
        .flatMap(chain::filter);
  }

  private ServerWebExchange withBearerToken(ServerWebExchange exchange, String tokenValue) {
    ServerHttpRequest mutatedRequest =
        exchange
            .getRequest()
            .mutate()
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenValue)
            .build();
    return exchange.mutate().request(mutatedRequest).build();
  }

  @Override
  public int getOrder() {
    return -1;
  }
}
