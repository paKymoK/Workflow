package com.takypok.authservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomOAuth2TokenCustomizer implements OAuth2TokenCustomizer<JwtEncodingContext> {

  private final ObjectMapper mapper;

  private static final Set<String> ID_TOKEN_CLAIMS =
      Set.of(
          IdTokenClaimNames.ISS,
          IdTokenClaimNames.SUB,
          IdTokenClaimNames.AUD,
          IdTokenClaimNames.EXP,
          IdTokenClaimNames.IAT,
          IdTokenClaimNames.AUTH_TIME,
          IdTokenClaimNames.NONCE,
          IdTokenClaimNames.ACR,
          IdTokenClaimNames.AMR,
          IdTokenClaimNames.AZP,
          IdTokenClaimNames.AT_HASH,
          IdTokenClaimNames.C_HASH);

  @Override
  public void customize(JwtEncodingContext context) {
    if (OidcParameterNames.ID_TOKEN.equals(context.getTokenType().getValue())) {
      Map<String, Object> thirdPartyClaims = extractClaims(context.getPrincipal());
      context
          .getClaims()
          .claims(
              existingClaims -> {
                // Remove conflicting claims set by this authorization server
                existingClaims.keySet().forEach(thirdPartyClaims::remove);

                // Remove standard id_token claims that could cause problems with clients
                ID_TOKEN_CLAIMS.forEach(thirdPartyClaims::remove);

                // Add all other claims directly to id_token
                existingClaims.putAll(thirdPartyClaims);
              });
    }

    if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
      context.getClaims().claim("test", mapper.convertValue(new Test("123"), HashMap.class));
    }
  }

  @Data
  @AllArgsConstructor
  public static class Test {
    private String name;
  }

  private Map<String, Object> extractClaims(Authentication principal) {
    Map<String, Object> claims;
    if (principal.getPrincipal() instanceof OidcUser oidcUser) {
      OidcIdToken idToken = oidcUser.getIdToken();
      claims = idToken.getClaims();
    } else if (principal.getPrincipal() instanceof OAuth2User oauth2User) {
      claims = oauth2User.getAttributes();
    } else {
      claims = Collections.emptyMap();
    }

    return new HashMap<>(claims);
  }
}
