package com.takypok.gatewayservice.authentication;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class CustomGlobalFilter implements GlobalFilter, Ordered {
  private final ServerOAuth2AuthorizedClientRepository authorizedClientRepository;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    System.out.println(exchange.getRequest().getURI().getPath());
    return exchange
        .getPrincipal()
        .filter(principal -> principal instanceof OAuth2AuthenticationToken)
        .cast(OAuth2AuthenticationToken.class)
        .flatMap(
            auth ->
                authorizedClientRepository.loadAuthorizedClient(
                    auth.getAuthorizedClientRegistrationId(), auth, exchange))
        .cast(OAuth2AuthorizedClient.class)
        .flatMap(
            client -> {
              System.out.println(client.getPrincipalName());
              System.out.println(client.getAccessToken().getTokenValue());
              exchange
                  .getRequest()
                  .getHeaders()
                  .setBearerAuth(client.getAccessToken().getTokenValue());
              return chain.filter(exchange);
            });
  }

  @Override
  public int getOrder() {
    return -1;
  }
}
