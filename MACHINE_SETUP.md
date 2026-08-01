# Running This Stack on a New Machine

This repo has a handful of values that are **specific to the machine it's running
on** and will silently break things (usually as mysterious 500s or empty metrics)
if not updated after cloning/pulling onto a different machine. This doc is the
checklist.

## Prerequisites

- Docker + Docker Compose v2 (`docker compose version`)
- These host ports free:

  | Port | Service |
  |---|---|
  | 8761 | discovery-service |
  | 9000 | auth-service |
  | 8080, 8090 | gateway-service |
  | 8085 | workflow-service |
  | 8082 | media-service |
  | 8084 | employee-service |
  | 5433 | postgres |
  | 29092 | kafka |
  | 6379 | redis |
  | 389, 636 | ldap |
  | 9090 | prometheus **and** ldap-ui (phpldapadmin) — these collide, see Known Gaps below |
  | 3100 | grafana |
  | 3101 | loki |
  | 3200, 4317, 4318 | tempo |
  | 12345 | alloy (live-debugging UI) |

## 1. Start independent infrastructure first

These run outside the main `docker-compose.yaml` (deliberately — they're meant to
be long-lived and managed separately from app service restarts):

```bash
docker compose -f infrastructure/postgres/docker-compose.yml up -d
docker compose -f infrastructure/kafka/docker-compose.yml up -d
docker compose -f infrastructure/ldap-local/docker-compose.yaml up -d openldap   # skip phpldapadmin, see Known Gaps
```

Redis: **no committed compose file exists for it** — see Known Gaps below for the
exact command to reproduce it manually until one is added.

Run these `docker compose` commands from the **repo root** (or otherwise with
project name `archive`) — that's what puts them on the `archive_default` Docker
network the app services and monitor stack expect to find them on by container
DNS name (`postgres`, `kafka`, `redis`).

## 2. Update `AUTH_ISSUER_URI` for this machine

This is the one that will bite you first. Every one of these 5 files hardcodes
the same LAN IP:

```
auth-service/docker-compose.yml
workflow-service/docker-compose.yml
gateway-service/docker-compose.yml
media-service/docker-compose.yml
employee-service/docker-compose.yml
```

Gateway uses this URL to do OIDC discovery and fetch the JWK set for validating
every incoming token. If it's stale or wrong for the current machine, **every
authenticated API call returns 500** (`AuthenticationServiceException: An error
occurred while attempting to decode the Jwt`) — this exact failure already
happened once when the dev machine's LAN IP changed.

Find the current machine's LAN IP:
- macOS: `ipconfig getifaddr en0`
- Linux: `ip -4 addr show | grep inet`
- Windows: `ipconfig` (look for IPv4 Address on the active adapter)

Then update all 5 files:

```bash
# macOS/Linux
grep -rl "AUTH_ISSUER_URI: http://" *-service/docker-compose.yml \
  | xargs sed -i '' 's|AUTH_ISSUER_URI: http://[0-9.]*:9000|AUTH_ISSUER_URI: http://<NEW_IP>:9000|g'
```

Why a LAN IP at all instead of a Docker service name: this URL also needs to be
reachable from outside Docker (browser/mobile clients on the same network doing
the OAuth2 flow directly against auth-service), so it can't just be
`http://auth-service:9000`.

## 3. Build and start the core services + monitor stack

From repo root:

```bash
docker compose -f docker-compose.yaml up -d --build \
  discovery-service auth-service workflow-service gateway-service
cd infrastructure/monitor && docker compose up -d
```

## 4. Platform-specific: per-container RAM/CPU/disk metrics (Alloy + cAdvisor)

`infrastructure/monitor/alloy/config.alloy` collects two kinds of metrics:

- **Host-level** (RAM/CPU/disk of the whole machine) — works everywhere.
- **Per-container** (exact RAM/CPU/disk-IO per Docker container, via an embedded
  cAdvisor) — **only works on a native Linux Docker host.** On Docker Desktop for
  Mac, this fails with `"failed to identify the read-write layer ID"` for every
  container because Docker Desktop virtualizes container storage in a way that
  doesn't expose consistent overlayfs layer metadata to bind-mounted introspection.
  Docker Desktop for Windows on the **WSL2 backend** (Settings → General → "Use
  the WSL 2 based engine") is architecturally closer to native Linux and may work
  — untested, verify with the query below.

No config changes needed per-platform — same `docker-compose.yml` and
`config.alloy` everywhere. To verify per-container metrics are actually working
on a given machine, query Prometheus (`http://localhost:9090`):

```
container_memory_usage_bytes
```

- Only a series with `id="/"` → not working on this machine (root cgroup
  aggregate only, same as this Mac).
- Series with `id="/docker/<container-id>"` and real container names → working.

## 5. Verifying everything came up correctly

```bash
# Eureka — should show AUTH-SERVICE, WORKFLOW-SERVICE, GATEWAY-SERVICE all UP
curl -s http://localhost:8761/eureka/apps -H "Accept: application/json"

# Health — should all return {"status":"UP"}
curl -s http://localhost:9000/actuator/health   # auth
curl -s http://localhost:8085/actuator/health   # workflow
curl -s http://localhost:8090/actuator/health   # gateway

# Logs flowing with level extraction (Loki, via Alloy)
curl -s "http://localhost:3101/loki/api/v1/label/level/values"
# should return ["DEBUG","ERROR","INFO","WARN"]
```

## Known gaps

- **Redis has no committed compose file.** Currently reproduced by hand:
  ```bash
  docker run -d --name redis --network archive_default -p 6379:6379 redis:7-alpine redis-server
  ```
  Worth adding a proper `infrastructure/redis/docker-compose.yml` — ask if you
  want this done.
- **Port 9090 collision**: Prometheus and ldap-ui (phpldapadmin) both want host
  port 9090. Don't run both at once, or remap one of them.
- **Grafana alert webhook is still a placeholder.** Set the real URL in
  `infrastructure/monitor/grafana/provisioning/alerting/contactpoints.yaml`
  before relying on the ERROR-log alert to actually notify anyone.
- **Debezium offset volume** (`offset_debezium`, mounted into workflow-service):
  on a genuinely fresh machine this starts empty and workflow-service will do a
  normal fresh connect — fine. The "stale offset" failure we hit before only
  happens if you copy an *old* `offset_debezium` volume onto a *different*
  Postgres instance whose WAL has already moved past that recorded position.
