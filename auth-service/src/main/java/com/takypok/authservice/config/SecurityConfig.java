package com.takypok.authservice.config;

import com.takypok.authservice.config.auth.DomainAuthenticationFilter;
import com.takypok.authservice.config.auth.DomainAuthenticationManager;
import java.util.Arrays;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.ldap.search.FilterBasedLdapUserSearch;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@EnableWebSecurity
@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

  @Value("${ldap.url}")
  private String ldapUrl;

  @Value("${ldap.base}")
  private String ldapBase;

  @Value("${ldap.username}")
  private String ldapUsername;

  @Value("${ldap.password}")
  private String ldapPassword;

  @Value("${ldap.user-search-base}")
  private String userSearchBase;

  @Value("${ldap.user-search-filter}")
  private String userSearchFilter;

  @Value("${ldap.group-search-base}")
  private String groupSearchBase;

  @Bean
  public LdapContextSource ldapContextSource() {
    LdapContextSource source = new LdapContextSource();
    source.setUrl(ldapUrl);
    source.setBase(ldapBase);
    source.setUserDn(ldapUsername);
    source.setPassword(ldapPassword);
    return source;
  }

  @Bean
  public LdapAuthenticationProvider ldapAuthenticationProvider(
      LdapContextSource ldapContextSource) {
    FilterBasedLdapUserSearch userSearch =
        new FilterBasedLdapUserSearch(userSearchBase, userSearchFilter, ldapContextSource);

    BindAuthenticator authenticator = new BindAuthenticator(ldapContextSource);
    authenticator.setUserSearch(userSearch);

    DefaultLdapAuthoritiesPopulator authoritiesPopulate =
        new DefaultLdapAuthoritiesPopulator(ldapContextSource, groupSearchBase);
    authoritiesPopulate.setGroupRoleAttribute("cn");
    authoritiesPopulate.setRolePrefix("ROLE_");
    authoritiesPopulate.setSearchSubtree(true);

    return new LdapAuthenticationProvider(authenticator, authoritiesPopulate);
  }

  @Bean
  public DaoAuthenticationProvider jdbcAuthenticationProvider(
      UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder);
    return provider;
  }

  @Bean
  public DomainAuthenticationFilter domainAuthenticationFilter(
      DomainAuthenticationManager domainAuthenticationManager,
      SecurityContextRepository securityContextRepository) {
    DomainAuthenticationFilter filter = new DomainAuthenticationFilter(domainAuthenticationManager);
    filter.setFilterProcessesUrl("/login");
    filter.setSecurityContextRepository(securityContextRepository);
    filter.setAuthenticationSuccessHandler(new SavedRequestAwareAuthenticationSuccessHandler());
    filter.setAuthenticationFailureHandler(
        new SimpleUrlAuthenticationFailureHandler("/login?error"));
    return filter;
  }

  @Bean
  public SecurityFilterChain defaultSecurityFilterChain(
      HttpSecurity http,
      DomainAuthenticationFilter domainAuthenticationFilter,
      SecurityContextRepository securityContextRepository)
      throws Exception {

    return http.csrf(AbstractHttpConfigurer::disable)
        .cors(AbstractHttpConfigurer::disable)
        .securityContext(
            context ->
                context
                    .securityContextRepository(securityContextRepository)
                    .requireExplicitSave(true))
        .authorizeHttpRequests(
            authorize ->
                authorize
                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers("/assets/**", "/login/**", "/logout", "/v1/**", "/actuator/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .addFilterAt(domainAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(
            ex -> ex.authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login")))
        .build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedMethods(
        Arrays.asList("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));
    configuration.setAllowedHeaders(Collections.singletonList("*"));
    configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
    configuration.setAllowCredentials(true);
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public SessionRegistry sessionRegistry() {
    return new SessionRegistryImpl();
  }

  @Bean
  public HttpSessionEventPublisher httpSessionEventPublisher() {
    return new HttpSessionEventPublisher();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }

  @Bean
  public SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }
}
