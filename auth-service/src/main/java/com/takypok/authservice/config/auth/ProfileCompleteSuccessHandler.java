package com.takypok.authservice.config.auth;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.repository.UserInfoRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;

@Slf4j
@RequiredArgsConstructor
public class ProfileCompleteSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

  private final UserInfoRepository userInfoRepository;
  private final JdbcUserDetailsManager userDetailsManager;
  private final PasswordEncoder passwordEncoder;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException, ServletException {

    String username = authentication.getName();
    Userinfo userinfo = userInfoRepository.getBySub(username);

    if (userinfo == null) {
      userinfo = provisionUser(username);
    }

    if (isIncomplete(userinfo)) {
      response.sendRedirect(request.getContextPath() + "/profile/complete");
      return;
    }

    super.onAuthenticationSuccess(request, response, authentication);
  }

  private Userinfo provisionUser(String username) {
    if (!userDetailsManager.userExists(username)) {
      // First-time LDAP user: create a locked local entry so FK constraints are satisfied.
      // The password is a random bcrypt hash — it can never be used for JDBC login.
      var user =
          User.builder()
              .username(username)
              .password(passwordEncoder.encode(UUID.randomUUID().toString()))
              .roles("USER")
              .build();
      userDetailsManager.createUser(user);
      log.info("Auto-provisioned local account for LDAP user: {}", username);
    }

    Userinfo info = new Userinfo();
    info.setSub(username);
    info.setName(username);
    // email, title, department intentionally null — user completes them on the profile page
    Userinfo saved = userInfoRepository.save(info);
    log.info("Created userinfo record for: {}", username);
    return saved;
  }

  private boolean isIncomplete(Userinfo userinfo) {
    return isBlank(userinfo.getTitle()) || isBlank(userinfo.getDepartment());
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
