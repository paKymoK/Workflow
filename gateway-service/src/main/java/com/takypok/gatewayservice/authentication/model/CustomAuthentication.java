package com.takypok.gatewayservice.authentication.model;

import com.takypok.core.model.authentication.User;
import java.util.Collection;
import java.util.Objects;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public class CustomAuthentication implements Authentication {
  private final String principal; // User identity, e.g., username or ID
  private boolean authenticated;
  private final User user;
  private final String bearer;

  public CustomAuthentication(String principal, User user, boolean authenticated, String bearer) {
    this.principal = principal;
    this.authenticated = authenticated;
    this.user = user;
    this.bearer = bearer;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return null; // Return authorities/roles if needed
  }

  @Override
  public Object getCredentials() {
    if (Objects.isNull(bearer)) {
      return "";
    }
    return bearer; // Return credentials if applicable
  }

  @Override
  public User getDetails() {
    return this.user; // Return additional details if applicable
  }

  @Override
  public String getPrincipal() {
    return principal; // Return the principal
  }

  @Override
  public boolean isAuthenticated() {
    return authenticated;
  }

  @Override
  public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
    this.authenticated = isAuthenticated;
  }

  @Override
  public String getName() {
    return user.getName(); // Return a name or identifier for the principal
  }
}
