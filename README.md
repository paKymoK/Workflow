# Workflow Platform

A full-stack, microservice-based workflow ecosystem built with **Spring Boot + Spring Cloud** on the backend and **React + Vite** on the frontend.

This repository combines identity, API gateway, service discovery, workflow orchestration, media, chat, and shop capabilities into a modular platform designed for local development and iterative feature delivery.

---

## Architecture at a glance

- **Frontend**: `workflow-front-end` (React 19, TypeScript, Vite, Ant Design, TanStack Query)
- **API Gateway**: `gateway-service` (Spring Cloud Gateway, WebFlux, OAuth2)
- **Service Discovery**: `discovery-service` (Netflix Eureka)
- **Identity/Auth**: `auth-service` (Spring Security, OAuth2 Authorization Server, LDAP, PostgreSQL)
- **Business Services**:
  - `workflow-service` (core workflow domain, Redis, R2DBC, Liquibase, Debezium)
  - `media-service`
  - `chat-service`
  - `shop-service`
- **Shared Libraries**:
  - `core-v1`
  - `infrastructure`

---

## Repository structure

```text
.
├─ auth-service/
├─ chat-service/
├─ core-v1/
├─ discovery-service/
├─ gateway-service/
├─ infrastructure/
├─ media-service/
├─ shop-service/
├─ workflow-service/
├─ workflow-front-end/
├─ postgres/                # local PostgreSQL container config
├─ ldap-local/              # local LDAP + phpLDAPadmin config
├─ build.gradle             # multi-module Gradle build
└─ settings.gradle          # included modules
```

---

## Tech stack

### Backend
- Java 17
- Spring Boot 3.5.x
- Spring Cloud 2025.0.0
- Spring Security + OAuth2
- Eureka, Gateway (WebFlux)
- PostgreSQL, Redis
- Liquibase
- Debezium
- Gradle (multi-module)

### Frontend
- React 19 + TypeScript
- Vite 7
- Ant Design 6
- Tailwind CSS 4
- TanStack Query
- TipTap / XYFlow / Recharts

---

## Local development prerequisites

- **JDK 17**
- **Gradle wrapper** (included)
- **Node.js 20+** (recommended)
- **Docker** + Docker Compose

---

## Quick start

### 0) Create Docker network (once per machine)

```bash
docker network create takypok-network
```

---

### 1) Start infrastructure

#### PostgreSQL
```bash
cd postgres
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### LDAP (optional, for auth/LDAP flows)
```bash
cd ldap-local
docker-compose up -d
```

- LDAP UI: `http://localhost:8090`
- LDAP host: `ldap://localhost:389`

---

### 2) Run backend services

From repository root:

```bash
./gradlew :discovery-service:bootRun
./gradlew :auth-service:bootRun
./gradlew :gateway-service:bootRun
./gradlew :workflow-service:bootRun
./gradlew :media-service:bootRun
./gradlew :chat-service:bootRun
./gradlew :shop-service:bootRun
```

> Run these in separate terminals, or use your IDE run configurations.

Default ports from current configs:
- Discovery: `8761`
- Auth: `9000`
- Gateway: `8080`
- Workflow service: `8081`

---

### 3) Run frontend

```bash
cd workflow-front-end
npm install
npm run dev
```

Frontend will start on Vite’s default local dev URL (typically `http://localhost:5173`).

---

## API routing overview

The gateway rewrites and routes these paths to internal services:

- `/auth-service/**`
- `/workflow-service/**`
- `/media-service/**`
- `/chat-service/**`
- `/shop-service/**`

Swagger aggregation is exposed through gateway config (`/swagger-ui.html`).

---

## Build & test

From root:

```bash
./gradlew clean build
./gradlew test
```

Frontend:

```bash
cd workflow-front-end
npm run build
npm run lint
```

---

## Notes

- Root Gradle applies shared dependency/configuration logic across all modules.
- Spotless formatting is configured in root `build.gradle`.
- Service-specific environment overrides are available via YAML placeholders (for example DB host/port and Eureka URI).

---

## License

No license file is currently declared in this repository. Add one if you intend to distribute externally.
