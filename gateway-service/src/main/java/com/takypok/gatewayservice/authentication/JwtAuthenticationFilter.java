package com.takypok.gatewayservice.authentication;

import static com.takypok.core.util.AuthenticationUtil.rejectAccess;
import static com.takypok.core.util.JwtUtil.extractAccessToken;
import static com.takypok.core.util.JwtUtil.extractUserFromAccessToken;

import com.takypok.core.model.authentication.User;
import com.takypok.gatewayservice.authentication.model.CustomAuthentication;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Slf4j
public class JwtAuthenticationFilter implements WebFilter {
  private final ReactiveAuthenticationManager authenticationManager;
  private final ServerWebExchangeMatcher whiteListExchange;
  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  private final List<HttpMethod> authHttpMethod =
      List.of(HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE);

  public JwtAuthenticationFilter(
      ReactiveAuthenticationManager authenticationManager,
      ServerWebExchangeMatcher whiteListExchange) {
    this.authenticationManager = authenticationManager;
    this.whiteListExchange = whiteListExchange;
  }

  @NonNull
  @Override
  public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
    return this.whiteListExchange
        .matches(exchange)
        .map(ServerWebExchangeMatcher.MatchResult::isMatch)
        .flatMap(shouldFilter -> doFilter(exchange, chain, shouldFilter));
  }

  private Mono<Void> doFilter(
      ServerWebExchange exchange, WebFilterChain chain, Boolean shouldFilter) {
    if (Boolean.FALSE.equals(shouldFilter)) {
      return chain.filter(exchange);
    }
    ServerHttpRequest request = exchange.getRequest();
    ServerHttpResponse response = exchange.getResponse();
    if (authHttpMethod.contains(request.getMethod())) {
      if (Objects.nonNull(extractAccessToken(request))) {
        User user = extractUserFromAccessToken(extractAccessToken(request));
        System.out.println(user);
        if (Objects.isNull(user) || !validator.validate(user).isEmpty()) {
          return rejectAccess(request, response);
        }
        return authenticationManager
            .authenticate(
                new CustomAuthentication(user.getName(), user, true, extractAccessToken(request)))
            .map(ReactiveSecurityContextHolder::withAuthentication)
            .flatMap(contextView -> chain.filter(exchange).contextWrite(contextView));
      }
      return rejectAccess(request, response);
    } else {
      return chain.filter(exchange);
    }
  }
}
