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
  serviceConfiguration: {
    authorizationEndpoint: `${AUTH_SERVER}/oauth2/authorize`,
    tokenEndpoint: `${AUTH_SERVER}/oauth2/token`,
    revocationEndpoint: `${AUTH_SERVER}/oauth2/revoke`,
  },
};
