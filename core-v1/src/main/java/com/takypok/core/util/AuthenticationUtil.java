package com.takypok.core.util;

import static com.takypok.core.config.ConfigObjectMapper.objectMapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.ResultStatus;
import com.takypok.core.model.authentication.User;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationUtil {
  public static Mono<Void> rejectAccess(ServerHttpRequest request, ServerHttpResponse response) {
    log.error("Unauthorized access to {}", request.getURI());
    return setUnauthorized(response);
  }

  public static Mono<Void> rejectAccess(ServerWebExchange exchange) {
    ServerHttpRequest request = exchange.getRequest();
    ServerHttpResponse response = exchange.getResponse();
    log.error("Unauthorized access to {}", request.getURI());
    return setUnauthorized(response);
  }

  public static Mono<Void> rejectAccess(WebFilterExchange exchange) {
    ServerHttpRequest request = exchange.getExchange().getRequest();
    ServerHttpResponse response = exchange.getExchange().getResponse();
    log.error("Unauthorized access to {}", request.getURI());
    return setUnauthorized(response);
  }

  private static Mono<Void> setUnauthorized(ServerHttpResponse response) {
    response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
    response.setStatusCode(HttpStatus.FORBIDDEN);
    ObjectMapper objectMapper = new ObjectMapper();
    try {
      DataBuffer responseBuffer =
          response
              .bufferFactory()
              .wrap(
                  objectMapper
                      .writeValueAsString(
                          new ResultMessage<>(new ResultStatus("403", "Unauthorized"), null))
                      .getBytes(StandardCharsets.UTF_8));
      return response.writeWith(Mono.just(responseBuffer));
    } catch (Exception ignored) {
      return Mono.empty();
    }
  }

  public static User getUserInfo(Authentication authentication) {
    Jwt jwt = (Jwt) authentication.getPrincipal();
    return objectMapper().convertValue(jwt.getClaims().get("detail"), new TypeReference<>() {});
  }
}
