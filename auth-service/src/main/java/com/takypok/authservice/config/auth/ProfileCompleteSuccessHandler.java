package com.takypok.authservice.config.auth;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.repository.UserInfoRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;

@RequiredArgsConstructor
public class ProfileCompleteSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

  private final UserInfoRepository userInfoRepository;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException, ServletException {

    Userinfo userinfo = userInfoRepository.getBySub(authentication.getName());

    if (userinfo != null && isIncomplete(userinfo)) {
      // The original OAuth2 request is already saved in HttpSessionRequestCache by
      // AbstractAuthenticationProcessingFilter — leave it there, redirect to profile page.
      response.sendRedirect(request.getContextPath() + "/profile/complete");
      return;
    }

    super.onAuthenticationSuccess(request, response, authentication);
  }

  private boolean isIncomplete(Userinfo userinfo) {
    return isBlank(userinfo.getTitle()) || isBlank(userinfo.getDepartment());
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
