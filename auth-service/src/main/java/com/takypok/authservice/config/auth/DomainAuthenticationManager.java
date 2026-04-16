package com.takypok.authservice.config.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DomainAuthenticationManager implements AuthenticationManager {

  private final LdapAuthenticationProvider ldapAuthenticationProvider;
  private final DaoAuthenticationProvider jdbcAuthenticationProvider;

  @Override
  public Authentication authenticate(Authentication authentication) {
    DomainAuthenticationToken token = (DomainAuthenticationToken) authentication;

    return switch (token.getDomain()) {
      case "INTERNAL" -> ldapAuthenticationProvider.authenticate(token);
      case "GUEST" -> jdbcAuthenticationProvider.authenticate(token);
      case "COMPANY_A" -> jdbcAuthenticationProvider.authenticate(token); // swap later
      case "COMPANY_B" -> jdbcAuthenticationProvider.authenticate(token); // swap later
      default -> throw new BadCredentialsException("Unknown domain: " + token.getDomain());
    };
  }
}
