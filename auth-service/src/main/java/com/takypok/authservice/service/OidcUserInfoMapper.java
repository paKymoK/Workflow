package com.takypok.authservice.service;

import com.takypok.authservice.model.UserInfo;
import com.takypok.authservice.repository.UserInfoRepository;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.oidc.authentication.OidcUserInfoAuthenticationContext;

@RequiredArgsConstructor
@Slf4j
public class OidcUserInfoMapper
    implements Function<OidcUserInfoAuthenticationContext, OidcUserInfo> {
  private final UserInfoRepository userInfoRepository;

  @Override
  public OidcUserInfo apply(OidcUserInfoAuthenticationContext context) {
    OAuth2Authorization authorization = context.getAuthorization();
    String username = authorization.getPrincipalName();

    UserInfo userInfo = userInfoRepository.getBySub(username);

    OidcUserInfo.Builder userInfoBuilder = OidcUserInfo.builder();
    userInfoBuilder.subject(username);
    userInfoBuilder.email(userInfo.getEmail());

    // TODO: Add other claims from your database (e.g., email, name, address)
    return userInfoBuilder.build();
  }
}
