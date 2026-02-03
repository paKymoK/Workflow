package com.takypok.core.config;

import com.takypok.core.Constants;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

@Slf4j
@Component
@RequiredArgsConstructor
public class TraceFilter implements WebFilter {
  @NonNull
  @Override
  public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
    ServerHttpRequest request = exchange.getRequest();
    ServerHttpResponse response = exchange.getResponse();

    if (String.valueOf(request.getURI()).contains("/web-socket/")) {
      return chain.filter(exchange);
    }

    if (String.valueOf(request.getURI()).contains("/actuator/")) {
      return chain.filter(exchange);
    }

    return ReactiveSecurityContextHolder.getContext()
        .map(
            securityContext -> {
              ServerWebExchange serverWebExchange =
                  exchange.mutate().response(decorateResponse(request, response)).build();
              String requestId =
                  Optional.ofNullable(request.getHeaders().getFirst(Constants.X_REQUEST_ID))
                      .orElse(UUID.randomUUID().toString());

              String userId = securityContext.getAuthentication().getName();

              serverWebExchange.getResponse().getHeaders().add(Constants.USER_ID, userId);
              serverWebExchange.getResponse().getHeaders().add(Constants.X_REQUEST_ID, requestId);

              return Tuples.of(serverWebExchange, requestId, userId);
            })
        .flatMap(
            tuples ->
                chain
                    .filter(tuples.getT1())
                    .contextWrite(
                        context ->
                            context
                                .put(Constants.X_REQUEST_ID, tuples.getT2())
                                .put(Constants.USER_ID, tuples.getT3())));
  }

  private ServerHttpResponse decorateResponse(
      ServerHttpRequest request, ServerHttpResponse response) {
    return new ServerHttpResponseDecorator(response) {
      @NonNull
      @Override
      public Mono<Void> writeWith(@NonNull Publisher<? extends DataBuffer> body) {
        return DataBufferUtils.join(body)
            .flatMap(
                dataBuffer -> {
                  byte[] bytes = new byte[dataBuffer.readableByteCount()];
                  dataBuffer.read(bytes);
                  DataBufferUtils.release(dataBuffer);
                  String responseBody = new String(bytes, StandardCharsets.UTF_8);
                  log.info("[Response to {}]: {}", request.getRemoteAddress(), responseBody);
                  DataBuffer newBuffer = bufferFactory().wrap(bytes);
                  return super.writeWith(Mono.just(newBuffer));
                });
      }
    };
  }
}
