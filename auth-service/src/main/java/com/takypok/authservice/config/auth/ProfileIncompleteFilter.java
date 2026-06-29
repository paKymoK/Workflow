package com.takypok.authservice.config.auth;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.repository.UserInfoRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class ProfileIncompleteFilter extends OncePerRequestFilter {

  private final UserInfoRepository userInfoRepository;
  private final RequestCache requestCache = new HttpSessionRequestCache();

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
      filterChain.doFilter(request, response);
      return;
    }

    Userinfo userinfo = userInfoRepository.getBySub(auth.getName());
    if (userinfo != null && isIncomplete(userinfo)) {
      // Preserve the original target (e.g. /oauth2/authorize saved by the login entry point).
      // Never overwrite an existing saved request — otherwise sub-resource requests issued by
      // the profile page (favicon, scripts) would clobber it and break the post-completion
      // redirect.
      if (requestCache.getRequest(request, response) == null) {
        requestCache.saveRequest(request, response);
      }
      response.sendRedirect(request.getContextPath() + "/profile/complete");
      return;
    }

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/profile/complete")
        || path.startsWith("/assets/")
        || path.startsWith("/admin/assets/")
        || path.startsWith("/login")
        || path.startsWith("/logout")
        || path.startsWith("/oauth2/consent")
        || path.startsWith("/error")
        || path.startsWith("/actuator/")
        || isStaticResource(path);
  }

  private boolean isStaticResource(String path) {
    return path.endsWith(".svg")
        || path.endsWith(".png")
        || path.endsWith(".ico")
        || path.endsWith(".js")
        || path.endsWith(".css");
  }

  private boolean isIncomplete(Userinfo userinfo) {
    return isBlank(userinfo.getTitle()) || isBlank(userinfo.getDepartment());
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
