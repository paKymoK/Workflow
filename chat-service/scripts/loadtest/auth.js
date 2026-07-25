// auth.js
// Provisions throwaway GUEST users against auth-service and completes the
// authorization_code + PKCE flow (headlessly, via cookies) to obtain a JWT
// that chat-service's oauth2 resource server will accept.
//
// This mirrors what a real browser client does, minus the UI:
//   1. POST /v1/users          -> create a GUEST account (public endpoint)
//   2. POST /login             -> authenticate, get a session cookie
//   3. GET  /oauth2/authorize  -> PKCE-protected code grant, redeems the cookie for a `code`
//   4. POST /oauth2/token      -> exchange the code for an access_token (JWT)
//
// The "workflow" OAuth2 client (id=workflow, secret=workflow-secret) is the only
// client seeded by default in AuthorizationServerConfig — see
// auth-service/src/main/java/com/takypok/authservice/config/AuthorizationServerConfig.java.
// It only supports authorization_code + refresh_token, so that's what we use here;
// there's no client_credentials grant available out of the box.

import http from 'k6/http';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';
import { check, fail } from 'k6';

const AUTH_URL = (__ENV.AUTH_URL || 'http://localhost:9000').replace(/\/$/, '');
const CLIENT_ID = __ENV.OAUTH_CLIENT_ID || 'workflow';
const CLIENT_SECRET = __ENV.OAUTH_CLIENT_SECRET || 'workflow-secret';
const REDIRECT_URI = __ENV.OAUTH_REDIRECT_URI || 'http://localhost:3000/callback';
// Accounts must NOT be under auth.internal-domain (default mycompany.local) —
// UserServiceImpl rejects that domain since it's reserved for LDAP/internal accounts.
const GUEST_DOMAIN = __ENV.LOADTEST_GUEST_DOMAIN || 'loadtest.local';

function randomString(len) {
  return encoding.b64encode(crypto.randomBytes(len), 'rawurl');
}

function basicAuthHeader(id, secret) {
  return 'Basic ' + encoding.b64encode(`${id}:${secret}`);
}

// Creates a fresh GUEST user (idempotency isn't needed — each call makes a unique sub)
// then drives it through login + PKCE authorize + token exchange.
// Returns { sub, email, accessToken, refreshToken, expiresAt }.
export function provisionAndLogin(label) {
  const email = `loadtest-${label}-${randomString(6)}@${GUEST_DOMAIN}`;
  const password = randomString(16);

  const createRes = http.post(
    `${AUTH_URL}/v1/users`,
    JSON.stringify({ username: email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'auth_create_user' } },
  );
  if (!check(createRes, { 'user provisioned': (r) => r.status === 200 })) {
    fail(`provisionAndLogin: failed to create user ${email}: ${createRes.status} ${createRes.body}`);
  }

  const loginRes = http.post(
    `${AUTH_URL}/login`,
    { username: email, password, domain: 'GUEST' },
    { redirects: 0, tags: { name: 'auth_login' } },
  );
  // 302 to /profile/complete is expected here — a freshly provisioned guest has no display
  // name yet (see LdapAutoProvisionSuccessHandler). We only need the session cookie it set,
  // which is already valid by the time that redirect decision is made.
  if (!check(loginRes, { 'login established session': (r) => r.status === 302 && r.cookies.JSESSIONID })) {
    fail(`provisionAndLogin: login failed for ${email}: ${loginRes.status} ${loginRes.body}`);
  }

  const codeVerifier = randomString(32);
  const codeChallenge = crypto.sha256(codeVerifier, 'base64rawurl');
  const state = randomString(8);

  const authorizeRes = http.get(
    `${AUTH_URL}/oauth2/authorize?` +
      `response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent('openid profile')}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}&code_challenge_method=S256`,
    { redirects: 0, tags: { name: 'auth_authorize' } },
  );
  const location = authorizeRes.headers['Location'] || authorizeRes.headers['location'];
  if (!check(authorizeRes, { 'authorize issued a code': () => authorizeRes.status === 302 && !!location && location.includes('code=') })) {
    fail(`provisionAndLogin: /oauth2/authorize did not return a code for ${email}: ${authorizeRes.status} ${location || authorizeRes.body}`);
  }
  const codeMatch = location.match(/[?&]code=([^&]+)/);
  const code = codeMatch && decodeURIComponent(codeMatch[1]);
  if (!code) {
    fail(`provisionAndLogin: could not extract code from redirect for ${email}: ${location}`);
  }

  const tokenRes = http.post(
    `${AUTH_URL}/oauth2/token`,
    {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
      tags: { name: 'auth_token' },
    },
  );
  if (!check(tokenRes, { 'token exchange succeeded': (r) => r.status === 200 })) {
    fail(`provisionAndLogin: token exchange failed for ${email}: ${tokenRes.status} ${tokenRes.body}`);
  }

  const body = tokenRes.json();
  return {
    sub: email,
    email,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    // access tokens are minted with a 15 minute TTL (see TokenSettings in
    // AuthorizationServerConfig) — stress runs longer than that need to re-provision or refresh.
    expiresAt: Date.now() + body.expires_in * 1000,
  };
}
