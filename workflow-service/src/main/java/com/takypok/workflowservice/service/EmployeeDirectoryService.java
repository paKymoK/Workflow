package com.takypok.workflowservice.service;

import com.takypok.core.model.UserSummary;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.security.Actor;
import java.util.List;
import reactor.core.publisher.Mono;

public interface EmployeeDirectoryService {
  Mono<User> getUser(String sub);

  Mono<List<UserSummary>> searchUsers(String q);

  /**
   * Exposes {@code managerSub} directly — {@link #getUser(String)}'s {@code User} mapping doesn't
   * carry it, since {@code core.model.authentication.User} is shared across every service and
   * widening it isn't worth the blast radius for one workflow-service-only need.
   */
  Mono<String> getManagerSub(String sub);

  /**
   * Resolves the acting user against the local directory instead of the JWT {@code info} claim, so
   * stamped fields (reporter, commenter, audit actor, approver...) reflect current employee-service
   * data rather than a snapshot frozen at login time. Falls back to a sub-only user if the
   * directory hasn't caught up yet (e.g. a brand new PENDING shell).
   */
  default Mono<User> resolveActingUser(Actor actor) {
    return getUser(actor.sub()).defaultIfEmpty(new User(actor.sub(), null, null, null, null, null));
  }
}
