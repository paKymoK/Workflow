# Frontend Monorepo

pnpm workspace containing two React apps that share a common library.

```
frontend/
├── packages/
│   └── shared/          # Shared auth, API client, theme, components
├── workflow-front-end/  # Workflow & ticket management app  (port 3000)
└── shop-front-end/      # Shop & cart app                  (port 3000)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 20 |
| pnpm | >= 9 |

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

---

## Installation

Run once from the `frontend/` directory — pnpm resolves the workspace and links `@takypok/shared` into both apps automatically:

```bash
cd frontend
pnpm install
```

---

## Environment variables

Each app reads its own `.env` file at startup. Create one from the example below inside each app's folder.

### workflow-front-end

```bash
# frontend/workflow-front-end/.env
VITE_AUTH_SERVER=http://127.0.0.1:9000
VITE_CLIENT_ID=workflow-frontend
VITE_REDIRECT_URI=http://localhost:3000/callback
VITE_SCOPES=openid profile offline_access
VITE_API_BASE_URL=http://localhost:8080
```

### shop-front-end

```bash
# frontend/shop-front-end/.env
VITE_AUTH_SERVER=http://127.0.0.1:9000
VITE_CLIENT_ID=shop-spa
VITE_REDIRECT_URI=http://localhost:3000/callback
VITE_SCOPES=openid profile offline_access
VITE_API_BASE_URL=http://localhost:8080
```

| Variable | Description |
|----------|-------------|
| `VITE_AUTH_SERVER` | Base URL of the OAuth2 authorization server |
| `VITE_CLIENT_ID` | OAuth2 client ID registered for this app |
| `VITE_REDIRECT_URI` | Callback URL after login — must match the registered redirect URI |
| `VITE_SCOPES` | OAuth2 scopes to request |
| `VITE_API_BASE_URL` | Base URL of the backend API gateway |

---

## Running an app

Both apps share the same port default (3000). Start only one at a time, or change the port in the app's `vite.config.ts`.

```bash
# Start the workflow app
pnpm --filter workflow-front-end dev

# Start the shop app
pnpm --filter shop-front-end dev
```

Or `cd` into the app folder and run directly:

```bash
cd frontend/workflow-front-end
pnpm dev
```

---

## Building for production

```bash
# Build one app
pnpm --filter workflow-front-end build
pnpm --filter shop-front-end build

# Build all packages and apps at once
pnpm -r build
```

Output is written to each app's `dist/` folder.

---

## Other useful commands

```bash
# Type-check all packages
pnpm -r tsc

# Lint all packages
pnpm -r lint

# Run a command only in the shared package
pnpm --filter @takypok/shared tsc
```

---

## Shared package (`@takypok/shared`)

The shared package lives in `packages/shared/` and is consumed as a workspace dependency — no build step required. Vite resolves it directly from TypeScript source.

Exports:

| Module | What it provides |
|--------|-----------------|
| `auth` | PKCE OAuth2 flow, `AuthProvider`, `useAuth` |
| `api` | Pre-configured axios instance, `queryClient` |
| `context` | `ThemeProvider`, `FontProvider`, `useTheme`, `useFont` |
| `config` | Ant Design dark/light token sets |
| `lib` | `navigate`, `tokenSync` helpers |
| `components` | `BubbleBackground` |

To use anything from it in an app:

```ts
import { useAuth, useTheme, api, BubbleBackground } from "@takypok/shared";
```

To add a new shared module, drop the file in `packages/shared/src/` and re-export it from `packages/shared/src/index.ts`.
