package com.takypok.workflowservice.security;

import com.takypok.core.model.authentication.Roles;
import com.takypok.core.model.authentication.User;
import com.takypok.core.util.AuthenticationUtil;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;

/**
 * The caller, resolved from the JWT: identity plus the roles they hold globally and per project.
 * This is the single object access rules are evaluated against — built once per request from the
 * {@link Authentication}.
 */
public final class Actor {

  private final String sub;
  private final User user;
  private final List<String> globalRoles;
  private final Map<String, List<String>> projectRoles;

  private Actor(
      String sub, User user, List<String> globalRoles, Map<String, List<String>> projectRoles) {
    this.sub = sub;
    this.user = user;
    this.globalRoles = globalRoles != null ? globalRoles : Collections.emptyList();
    this.projectRoles = projectRoles != null ? projectRoles : Collections.emptyMap();
  }

  public static Actor from(Authentication authentication) {
    return new Actor(
        // The JWT subject is always present, unlike the optional "info" claim (e.g. the
        // employee_mirror row it's sourced from hasn't been fed yet) — access-rule checks that
        // key off sub() must not go blind just because the display snapshot is missing.
        authentication.getName(),
        AuthenticationUtil.getUserInfo(authentication),
        AuthenticationUtil.getRoles(authentication),
        AuthenticationUtil.getProjectRoles(authentication));
  }

  public User user() {
    return user;
  }

  public String sub() {
    return sub;
  }

  public boolean isAdmin() {
    return globalRoles.contains(Roles.ADMIN);
  }

  /**
   * True if the actor is anything more than a plain requester — i.e. holds a staff role globally or
   * on any project. Used to decide whether ticket listings are scoped to the caller's own tickets.
   */
  public boolean hasAnyElevatedRole() {
    if (isAdmin() || !projectRoles.isEmpty()) {
      return true;
    }
    return globalRoles.stream().anyMatch(role -> !Roles.REQUESTER.equals(role));
  }

  /**
   * True if the actor holds any of the given roles on the project — either as a global grant (role
   * applies everywhere) or a grant scoped to this specific project. ADMIN always passes.
   */
  public boolean hasProjectRole(Long projectId, String... roles) {
    if (isAdmin()) {
      return true;
    }
    List<String> scoped =
        projectId == null
            ? Collections.emptyList()
            : projectRoles.getOrDefault(String.valueOf(projectId), Collections.emptyList());
    for (String role : roles) {
      if (globalRoles.contains(role) || scoped.contains(role)) {
        return true;
      }
    }
    return false;
  }
}
