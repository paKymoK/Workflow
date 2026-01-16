package com.takypok.gatewayservice.authentication.model;

import com.takypok.core.model.authentication.User;
import org.springframework.security.core.userdetails.UserDetails;
import reactor.core.publisher.Mono;

public class CustomReactiveUserDetails implements CustomReactiveUserDetailsService {

  @Override
  public Mono<UserDetails> findByUsername(String username) {
    return Mono.error(
        new UnsupportedOperationException("Find by UserName is not supported yet !!"));
  }

  @Override
  public Mono<UserDetails> findByUser(User user) {
    return Mono.just(new CustomUserDetails(user));
  }
}
