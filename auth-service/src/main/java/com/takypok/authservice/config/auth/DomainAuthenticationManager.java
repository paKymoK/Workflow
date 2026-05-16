package com.takypok.authservice.config.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DomainAuthenticationManager implements AuthenticationManager {

  private final LdapAuthenticationProvider ldapAuthenticationProvider;
  private final DaoAuthenticationProvider jdbcAuthenticationProvider;
  private final JdbcUserDetailsManager jdbcUserDetailsManager;

  @Override
  public Authentication authenticate(Authentication authentication) {
    DomainAuthenticationToken token = (DomainAuthenticationToken) authentication;

    Authentication result =
        switch (token.getDomain()) {
          case "INTERNAL" ->
              isJdbcAdmin(token.getName())
                  ? jdbcAuthenticationProvider.authenticate(token)
                  : ldapAuthenticationProvider.authenticate(token);
          case "GUEST" -> jdbcAuthenticationProvider.authenticate(token);
          default -> throw new BadCredentialsException("Unknown domain: " + token.getDomain());
        };

    if (result instanceof AbstractAuthenticationToken aat) {
      aat.setDetails(token.getDomain());
    }
    return result;
  }

  private boolean isJdbcAdmin(String username) {
    if (!jdbcUserDetailsManager.userExists(username)) return false;
    UserDetails user = jdbcUserDetailsManager.loadUserByUsername(username);
    return user.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
  }
}
