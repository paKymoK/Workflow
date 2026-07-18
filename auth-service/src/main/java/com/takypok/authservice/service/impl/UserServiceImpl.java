package com.takypok.authservice.service.impl;

import com.takypok.authservice.model.event.AccountEvent;
import com.takypok.authservice.model.request.CreateUserRequest;
import com.takypok.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
  private final JdbcUserDetailsManager userDetailsManager;
  private final KafkaTemplate<String, AccountEvent> kafkaTemplate;

  @Value("${auth.internal-domain}")
  private String internalDomain;

  @Value("${account-events.topic}")
  private String accountEventsTopic;

  @Override
  @Transactional
  public void create(CreateUserRequest request) {
    validateUsername(request.getUsername());
    PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    UserDetails user =
        User.builder()
            .username(request.getUsername())
            .password(encoder.encode(request.getPassword()))
            .roles("USER")
            .build();
    userDetailsManager.createUser(user);

    AccountEvent event = new AccountEvent(request.getUsername());
    kafkaTemplate
        .send(accountEventsTopic, event.getSub(), event)
        .whenComplete(
            (result, ex) -> {
              if (ex != null) {
                log.error("Failed to publish account event for sub {}", request.getUsername(), ex);
              }
            });
  }

  private void validateUsername(String username) {
    int atIndex = username.indexOf('@');
    if (atIndex < 1) {
      throw new IllegalArgumentException(
          "Username must be an email address (e.g. john@example.com)");
    }
    String domain = username.substring(atIndex + 1);
    if (domain.equalsIgnoreCase(internalDomain)) {
      throw new IllegalArgumentException(
          "Domain @" + internalDomain + " is reserved for internal accounts");
    }
  }
}
