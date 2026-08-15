import type { AuthConfiguration } from 'react-native-app-auth';

import { AUTH_SERVER, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES } from '@env';

export const authConfig: AuthConfiguration = {
  clientId: CLIENT_ID,
  // The merged "workflow" client has both NONE and CLIENT_SECRET_BASIC registered on
  // auth-service. The authorization_code exchange authenticates fine as a public/PKCE
  // client, but the refresh_token grant has no PKCE artifact to fall back on and gets
  // rejected ("client-secret is missing") unless Basic auth is sent — so, same as the web
  // app's refresh flow, send the shared secret via HTTP Basic for every token request.
  clientSecret: CLIENT_SECRET,
  clientAuthMethod: 'basic',
  redirectUrl: REDIRECT_URI,
  scopes: (SCOPES ?? 'openid profile offline_access').split(' '),
  usePKCE: true,
  // Without this, AppAuth-Android falls back to AnyBrowserMatcher and launches the
  // full Chrome app (address bar, tabs, menu) instead of an in-app sheet. Restricting
  // to the Custom Tab variant makes it behave like iOS's SFSafariViewController.
  androidAllowCustomBrowsers: ['chromeCustomTab'],
  // AUTH_SERVER is plain HTTP in local dev (10.0.2.2). AppAuth-Android's
  // DefaultConnectionBuilder hard-rejects non-https URLs and throws on a background
  // thread, crashing the app instead of raising a JS error. This swaps in
  // UnsafeConnectionBuilder so the token exchange can hit an http:// endpoint.
  dangerouslyAllowInsecureHttpRequests: true,
  serviceConfiguration: {
    authorizationEndpoint: `${AUTH_SERVER}/oauth2/authorize`,
    tokenEndpoint: `${AUTH_SERVER}/oauth2/token`,
    revocationEndpoint: `${AUTH_SERVER}/oauth2/revoke`,
  },
};
