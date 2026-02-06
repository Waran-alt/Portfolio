# Client Environment Variables

This document describes how environment variables are resolved for client applications (e.g. memoon-card) in the Portfolio monorepo, and how to override them.

## Resolution Order (Portfolio Integration)

When running clients via the Portfolio Docker stack, environment variables are resolved in this order (later overrides earlier):

1. **Portfolio root `.env`** – Shared vars for the whole stack (Portfolio main app + clients)
2. **Client root `.env`** – `clients/{id}/.env` – Client-specific overrides (if present)
3. **Docker Compose `environment`** – Overrides from `.generated/docker-compose.clients.yml` (see below)

**Note:** The discover-clients script does *not* add `backend/.env` or `frontend/.env` to Docker's `env_file`. Those sub-.env files are loaded by the application at runtime (e.g. via dotenv in backend `config/env.ts` and frontend `next.config.js`), not by Docker Compose.

**Note:** Docker Compose loads `env_file` entries in order. The `environment` section always overrides `env_file`. Client applications may also load `.env` files at runtime (e.g. via dotenv); those override earlier values within the process.

**Named `.env` variants** (e.g. `.env.local`, `.env.backend`, `.env.frontend`, `.env.development`): Docker Compose does *not* automatically load these—it only loads files explicitly listed in `env_file`. Named variants are typically loaded by the application (e.g. Next.js loads `.env.local`, `.env.development`, `.env.production` by convention). To use named files with Portfolio integration:

- **Option A (recommended):** Use directory-based files (`backend/.env`, `frontend/.env`) and ensure your app loads them via dotenv. This matches the current structure and requires no discover-clients changes.
- **Option B:** Add the named file to `env_file` in discover-clients (e.g. `./clients/{id}/.env.local`) so Docker injects it. You would need to extend the script for each variant you want to support.
- **Option C:** Load named files in your app code (e.g. `dotenv.config({ path: '.env.local', override: true })`) after loading the base `.env`. Ensure the file path is correct when running in Docker (relative to the app’s working directory inside the container).

If you use named variants, document which files your client loads and in what order, so overrides behave predictably.

## What discover-clients Sets

The `discover-clients` script adds only **dynamic** variables that depend on the client or Docker setup. These cannot be defined in static `.env` files:

| Variable | Service | Purpose |
|----------|---------|---------|
| `BACKEND_URL` | Frontend | Internal URL to backend (e.g. `http://memoon-card-backend:4002`) |
| `POSTGRES_HOST` | Backend | Shared Postgres service name (`postgres`) |
| `POSTGRES_DB` | Backend | Client database name (e.g. `memoon_card_db`) |
| `NODE_ENV` | Both | `development` |
| `CHOKIDAR_*`, `WATCHPACK_*` | Frontend | File watcher settings for Docker volume mounts |

All other variables (e.g. `NEXT_PUBLIC_API_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`) come from `.env` files.

## Client Sub-.env Structure

Clients typically use **directory-based** `.env` files (not named variants like `.env.backend`):

| File | Purpose |
|------|---------|
| `clients/{id}/.env` | Shared vars for the client (ports, `NODE_ENV`) |
| `clients/{id}/backend/.env` | Backend-specific (JWT, CORS, DB, rate limits) |
| `clients/{id}/frontend/.env` | Frontend-specific (e.g. `NEXT_PUBLIC_API_URL`) |

- **Backend** loads: root `.env` → `backend/.env` (in code via dotenv)
- **Frontend** loads: root `.env` → `frontend/.env` (in `next.config.js` via dotenv)

Docker Compose `env_file` in the generated config currently includes:
- `.env` (Portfolio root)
- `./clients/{id}/.env` (client root, if present)

`backend/.env` and `frontend/.env` are not in `env_file` but are loaded by the app at runtime when those directories are mounted. Variables from the app’s dotenv loading override what was set by Docker.

---

## How to Override Mounted / Inherited Environment Variables

To override values that come from the Portfolio root `.env` or from the discover-clients script, use the client’s own `.env` files.

### Overriding from the Portfolio root `.env`

1. Add or update the variable in `clients/{id}/.env` (client root).
2. Because the client root `.env` is loaded after the Portfolio root `.env`, its values override.

**Example:** Root `.env` has `NEXT_PUBLIC_API_URL=https://localhost/api/v1` (for the main Portfolio app). For a client, add to `clients/memoon-card/.env`:

```bash
NEXT_PUBLIC_API_URL=https://memoon-card.localhost
```

### Overriding per service (backend vs frontend)

Use the service-specific `.env` files:

- **Backend:** `clients/{id}/backend/.env` – overrides for backend-only vars (e.g. `CORS_ORIGIN`, `JWT_SECRET`, `POSTGRES_*`)
- **Frontend:** `clients/{id}/frontend/.env` – overrides for frontend-only vars (e.g. `NEXT_PUBLIC_API_URL`)

**Example:** Override the API URL only for the frontend in `clients/memoon-card/frontend/.env`:

```bash
NEXT_PUBLIC_API_URL=https://memoon-card.localhost
```

### Variables set by discover-clients

Variables like `BACKEND_URL`, `POSTGRES_HOST`, and `POSTGRES_DB` are set in the Docker Compose `environment` section and override any `.env` value. To change them you would need to modify the discover-clients script; normally you should not need to override these.

### Summary

| Want to override… | Use |
|-------------------|-----|
| Root `.env` values | `clients/{id}/.env` |
| Backend-specific vars | `clients/{id}/backend/.env` |
| Frontend-specific vars | `clients/{id}/frontend/.env` |
| Values from discover-clients | Not supported via `.env`; edit script if needed |

---

## See Also

- [CLIENT_PROJECT_START.md](./CLIENT_PROJECT_START.md) – Client setup and environment overview
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) – Portfolio-wide environment setup
