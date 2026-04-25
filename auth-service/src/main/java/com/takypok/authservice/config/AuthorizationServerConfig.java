package com.takypok.authservice.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.takypok.authservice.util.jose.Jwks;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Function;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.oidc.authentication.OidcUserInfoAuthenticationContext;
import org.springframework.security.oauth2.server.authorization.oidc.authentication.OidcUserInfoAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.DelegatingOAuth2TokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.JwtGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2AccessTokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
public class AuthorizationServerConfig {
  private static final String CUSTOM_CONSENT_PAGE_URI = "/oauth2/consent";

  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  public SecurityFilterChain authorizationServerSecurityFilterChain(
      HttpSecurity http,
      CorsConfigurationSource corsConfigurationSource,
      SecurityContextRepository securityContextRepository)
      throws Exception {
    Function<OidcUserInfoAuthenticationContext, OidcUserInfo> userInfoMapper =
        (context) -> {
          OidcUserInfoAuthenticationToken authentication = context.getAuthentication();
          JwtAuthenticationToken principal = (JwtAuthenticationToken) authentication.getPrincipal();
          return new OidcUserInfo(principal.getToken().getClaims());
        };

    OAuth2AuthorizationServerConfigurer authorizationServerConfigurer =
        OAuth2AuthorizationServerConfigurer.authorizationServer();

    http.csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .securityMatcher(authorizationServerConfigurer.getEndpointsMatcher())
        .securityContext(
            context ->
                context
                    .securityContextRepository(securityContextRepository)
                    .requireExplicitSave(true))
        .with(
            authorizationServerConfigurer,
            (authorizationServer) ->
                authorizationServer
                    .authorizationEndpoint(
                        authorizationEndpoint ->
                            authorizationEndpoint.consentPage(CUSTOM_CONSENT_PAGE_URI))
                    .oidc(
                        (oidc) ->
                            oidc.userInfoEndpoint(
                                (userInfo) -> userInfo.userInfoMapper(userInfoMapper))))
        .authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated())
        .exceptionHandling(
            (exceptions) ->
                exceptions.defaultAuthenticationEntryPointFor(
                    new LoginUrlAuthenticationEntryPoint("/login"),
                    new MediaTypeRequestMatcher(MediaType.TEXT_HTML)));
    return http.build();
  }

  @Bean
  public JdbcRegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate) {
    JdbcRegisteredClientRepository registeredClientRepository =
        new JdbcRegisteredClientRepository(jdbcTemplate);

    TokenSettings tokenSettings =
        TokenSettings.builder()
            .accessTokenTimeToLive(Duration.ofMinutes(10))
            .refreshTokenTimeToLive(Duration.ofDays(1))
            .reuseRefreshTokens(false)
            .build();

    RegisteredClient spaClient =
        RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("workflow-frontend")
            .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
            .tokenSettings(tokenSettings)
            .redirectUri("http://localhost:3000/callback")
            .redirectUri("https://app.thaiha.website/callback")
            .redirectUri("https://oauth.pstmn.io/v1/callback")
            .scope(OidcScopes.OPENID)
            .scope(OidcScopes.PROFILE)
            .scope("offline_access")
            .clientSettings(
                ClientSettings.builder()
                    .requireAuthorizationConsent(true)
                    .requireProofKey(true)
                    .build())
            .build();

    upsertClient(registeredClientRepository, jdbcTemplate, spaClient);
    return registeredClientRepository;
  }

  private void upsertClient(
      JdbcRegisteredClientRepository repository,
      JdbcTemplate jdbcTemplate,
      RegisteredClient desiredClient) {
    RegisteredClient existing = repository.findByClientId(desiredClient.getClientId());
    if (existing != null) {
      jdbcTemplate.update("DELETE FROM oauth2_registered_client WHERE id = ?", existing.getId());
      repository.save(RegisteredClient.from(desiredClient).id(existing.getId()).build());
      return;
    }
    repository.save(desiredClient);
  }

  @Bean
  public JdbcOAuth2AuthorizationService authorizationService(
      JdbcTemplate jdbcTemplate, RegisteredClientRepository registeredClientRepository) {
    return new JdbcOAuth2AuthorizationService(jdbcTemplate, registeredClientRepository);
  }

  @Bean
  public JdbcOAuth2AuthorizationConsentService authorizationConsentService(
      JdbcTemplate jdbcTemplate, RegisteredClientRepository registeredClientRepository) {

    return new JdbcOAuth2AuthorizationConsentService(jdbcTemplate, registeredClientRepository);
  }

  @Bean
  public OAuth2TokenGenerator<OAuth2Token> tokenGenerator(JWKSource<SecurityContext> jwkSource) {
    JwtGenerator jwtGenerator = new JwtGenerator(new NimbusJwtEncoder(jwkSource));
    OAuth2AccessTokenGenerator accessTokenGenerator = new OAuth2AccessTokenGenerator();

    OAuth2TokenGenerator<OAuth2RefreshToken> refreshTokenGenerator =
        (OAuth2TokenContext context) -> {
          if (!OAuth2TokenType.REFRESH_TOKEN.equals(context.getTokenType())) return null;
          if (!context
              .getRegisteredClient()
              .getAuthorizationGrantTypes()
              .contains(AuthorizationGrantType.REFRESH_TOKEN)) return null;
          Instant now = Instant.now();
          Instant expiresAt =
              now.plus(
                  context.getRegisteredClient().getTokenSettings().getRefreshTokenTimeToLive());
          return new OAuth2RefreshToken(UUID.randomUUID().toString(), now, expiresAt);
        };

    return new DelegatingOAuth2TokenGenerator(
        jwtGenerator, accessTokenGenerator, refreshTokenGenerator);
  }

  @Bean
  public JWKSource<SecurityContext> jwkSource() {
    RSAKey rsaKey = Jwks.generateRsa();
    JWKSet jwkSet = new JWKSet(rsaKey);
    return (jwkSelector, securityContext) -> jwkSelector.select(jwkSet);
  }

  @Bean
  public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
    return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
  }

  @Bean
  public AuthorizationServerSettings authorizationServerSettings() {
    return AuthorizationServerSettings.builder().build();
  }

  @Bean
  JdbcUserDetailsManager jdbcUserDetailsManager(DataSource dataSource) {
    return new JdbcUserDetailsManager(dataSource);
  }
}
