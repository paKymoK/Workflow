package com.takypok.gatewayservice.authentication.model;

import com.takypok.core.model.authentication.User;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import reactor.core.publisher.Mono;

public interface CustomReactiveUserDetailsService extends ReactiveUserDetailsService {
  Mono<UserDetails> findByUser(User user);
}
