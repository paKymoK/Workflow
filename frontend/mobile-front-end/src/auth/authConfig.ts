import type { AuthConfiguration } from 'react-native-app-auth';

import { AUTH_SERVER, CLIENT_ID, REDIRECT_URI, SCOPES } from '@env';

export const authConfig: AuthConfiguration = {
  clientId: CLIENT_ID,
  redirectUrl: REDIRECT_URI,
  scopes: (SCOPES ?? 'openid profile offline_access').split(' '),
  usePKCE: true,
  serviceConfiguration: {
    authorizationEndpoint: `${AUTH_SERVER}/oauth2/authorize`,
    tokenEndpoint: `${AUTH_SERVER}/oauth2/token`,
    revocationEndpoint: `${AUTH_SERVER}/oauth2/revoke`,
  },
};
