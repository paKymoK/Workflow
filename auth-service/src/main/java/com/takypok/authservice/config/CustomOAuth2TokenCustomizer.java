package com.takypok.authservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.authservice.config.auth.DomainAuthenticationToken;
import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.repository.ClientRoleAssignmentRepository;
import com.takypok.authservice.repository.ClientSessionPolicyRepository;
import com.takypok.authservice.repository.UserInfoRepository;
import com.takypok.core.Constants;
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
  private final ClientSessionPolicyRepository clientSessionPolicyRepository;

  @Override
  public void customize(JwtEncodingContext context) {
    if (!OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) return;
    Authentication principal = context.getPrincipal();
    if (principal == null) return;
    String subject = principal.getName();
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
    List<String> roles = clientRoleAssignmentRepository.findRolesForUserOnClient(clientId, subject);
    if (!roles.isEmpty()) {
      context.getClaims().claim("roles", roles);
    }

    // Embed per-client session policy as an opaque claim — only present for single-tab clients
    clientSessionPolicyRepository
        .findById(clientId)
        .filter(p -> p.isSingleTab())
        .ifPresent(
            p -> {
              String encoded =
                  p.isFailOpen() ? Constants.SESSION_POLICY_OPEN : Constants.SESSION_POLICY_CLOSED;
              context.getClaims().claim(Constants.SESSION_POLICY_CLAIM, encoded);
            });
  }
}
