package com.takypok.authservice.config.auth;

import com.takypok.authservice.model.event.AccountEvent;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;

/**
 * On a first-time LDAP login, auto-provisions a disabled local shadow row in Spring Security's own
 * {@code users} table. That row backs group membership and role assignment FKs (an authorization
 * concern) — unrelated to HR data, so it survives even though employee-service now owns the profile
 * record that used to gate login here.
 *
 * <p>First-time-seen is also the moment this sub becomes "real" for an internal/LDAP user — nobody
 * provisions their login through auth-service, LDAP already did. So this is the hook that tells
 * employee-service it's safe to create a shell record for them.
 */
@Slf4j
@RequiredArgsConstructor
public class LdapAutoProvisionSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

  private final JdbcUserDetailsManager userDetailsManager;
  private final PasswordEncoder passwordEncoder;
  private final KafkaTemplate<String, AccountEvent> kafkaTemplate;
  private final String accountEventsTopic;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException, ServletException {

    String username = authentication.getName();
    if (!userDetailsManager.userExists(username)) {
      // The password is a random bcrypt hash — it can never be used for JDBC login.
      var user =
          User.builder()
              .username(username)
              .password(passwordEncoder.encode(UUID.randomUUID().toString()))
              .disabled(true)
              .roles("USER")
              .build();
      userDetailsManager.createUser(user);
      log.info("Auto-provisioned local account for LDAP user: {}", username);

      AccountEvent event = new AccountEvent(username);
      kafkaTemplate
          .send(accountEventsTopic, event.getSub(), event)
          .whenComplete(
              (result, ex) -> {
                if (ex != null) {
                  log.error("Failed to publish account event for sub {}", username, ex);
                }
              });
    }

    super.onAuthenticationSuccess(request, response, authentication);
  }
}
