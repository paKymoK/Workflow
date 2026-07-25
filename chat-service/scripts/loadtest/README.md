# chat-service load / stress tests

k6 scripts that stress-test chat-service's conversation & messaging REST API
end-to-end, including real authentication against auth-service (no mocked
tokens) — the same OAuth2 authorization_code + PKCE flow the frontend uses.

## Files

- `auth.js` — provisions a throwaway GUEST account and drives it through
  `POST /v1/users` → `POST /login` → `GET /oauth2/authorize` (PKCE) →
  `POST /oauth2/token` to get a real JWT access token.
- `chat-conversations-stress-test.js` — the actual stress test. In `setup()`
  it provisions N accounts, creates one shared GROUP conversation ("busy
  channel") and pairs up DIRECT conversations, then in the default function
  each virtual user repeatedly sends messages, lists messages, reacts, marks
  read, sends typing indicators, lists conversations, and occasionally DMs —
  a weighted mix approximating real chat traffic.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed
  (`brew install k6`, or `docker run --rm -i grafana/k6 run - <script.js`).
- The local stack running (`docker compose up` from the repo root, or at
  least: postgres, redis, kafka, discovery-service, auth-service,
  chat-service, gateway-service).

This targets **local/dev environments only**. It creates real accounts and
real conversations/messages that are not cleaned up afterwards.

## Running

```bash
k6 run chat-service/scripts/loadtest/chat-conversations-stress-test.js
```

Default profile: ramps to 30 VUs over 30s, holds for 2 minutes, ramps down
over 30s, going through the gateway at `http://localhost:8080/chat-service`.

### Common overrides

```bash
# Hit chat-service directly, bypassing the gateway
k6 run -e CHAT_URL=http://localhost:8083 chat-service/scripts/loadtest/chat-conversations-stress-test.js

# Heavier run: 100 peak VUs, 5 minute steady state
k6 run -e PEAK_VUS=100 -e STEADY=5m chat-service/scripts/loadtest/chat-conversations-stress-test.js

# Point at a non-default auth-service / OAuth2 client
k6 run -e AUTH_URL=http://localhost:9000 -e OAUTH_CLIENT_ID=workflow -e OAUTH_CLIENT_SECRET=workflow-secret \
  chat-service/scripts/loadtest/chat-conversations-stress-test.js
```

All supported env vars are documented in the header comment of
`chat-conversations-stress-test.js`.

## Notes / limitations

- Access tokens are minted with a **15 minute TTL**
  (`AuthorizationServerConfig.java`'s `TokenSettings`). Keep `STEADY` well
  under that, or requests will start failing on 401 near the end of a long
  run — the script does not currently refresh tokens mid-run.
- Only the `workflow` OAuth2 client is seeded by default and it only
  supports `authorization_code` + `refresh_token` (no `client_credentials`),
  which is why this uses the full cookie-based login + PKCE flow instead of
  a simpler client-credentials grant.
- `setup()` provisions accounts and creates conversations sequentially
  (one HTTP round-trip chain per user), so start-up time scales roughly
  linearly with `CHAT_USERS`/`PEAK_VUS`. For very large runs, provisioning
  can take a while before load actually starts.
- Thresholds (`http_req_failed < 1%`, p95 latency < 800ms) are a reasonable
  starting point, not a hard SLA — tune them in `options.thresholds` to
  match whatever chat-service is actually expected to sustain.
