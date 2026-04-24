package com.takypok.authservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.authservice.config.auth.DomainAuthenticationToken;
import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.repository.ClientRoleAssignmentRepository;
import com.takypok.authservice.repository.UserInfoRepository;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomOAuth2TokenCustomizer implements OAuth2TokenCustomizer<JwtEncodingContext> {

  private final ObjectMapper mapper;
  private final UserInfoRepository userInfoRepository;
  private final ClientRoleAssignmentRepository clientRoleAssignmentRepository;

  @Override
  public void customize(JwtEncodingContext context) {
    Authentication principal = context.getPrincipal();
    String subject = principal.getName();
    if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
      Userinfo userinfo = userInfoRepository.getBySub(subject);
      if (userinfo != null) {
        context.getClaims().claim("info", mapper.convertValue(userinfo, HashMap.class));
      }

      if (principal instanceof DomainAuthenticationToken domainToken) {
        context.getClaims().claim("domain", domainToken.getDomain());
      } else {
        context.getClaims().claim("domain", "INTERNAL");
      }

      // Resolve all roles for this user on the requesting client (UNION of direct + group roles)
      String clientId = context.getRegisteredClient().getId();
      List<String> roles =
          clientRoleAssignmentRepository.findRolesForUserOnClient(clientId, subject);
      if (!roles.isEmpty()) {
        context.getClaims().claim("roles", roles);
      }
    }
  }
}
