# Hostinger deployment (Portfolio landing)

Production deploys **only the Next.js landing** (`focus-on-pixel.com`). The VPS pulls a pre-built
image from **GHCR** — no Docker build on the host.

| Compose file                       | Use                                              |
| ---------------------------------- | ------------------------------------------------ |
| **`docker-compose.hostinger.yml`** | Hostinger / CI (GHCR pull)                       |
| **`docker-compose.deploy.yml`**    | Local or emergency VPS rebuild (`build` on host) |

## Flow

1. **Push to `main`** → workflow **CI** runs (lint, `yarn build:frontend`, audit).
2. **Deploy is manual** → **Actions → Deploy landing to Hostinger → Run workflow** (after CI is
   green).
3. Workflow builds the frontend image on GitHub Actions, pushes to GHCR, Hostinger VPS **pulls** and
   restarts.
4. One-shot **`post-deploy-prune`** removes old `portfolio-frontend` images on the VPS
   (project-scoped).

## One-time GitHub setup

**Settings → Secrets and variables → Actions → Repository**

### Secrets

| Name                | Required | Description                                                        |
| ------------------- | -------- | ------------------------------------------------------------------ |
| `HOSTINGER_API_KEY` | Yes      | [hPanel → Profile → API](https://hpanel.hostinger.com/profile/api) |

### Variables

| Name                       | Required | Default                        | Description                                                       |
| -------------------------- | -------- | ------------------------------ | ----------------------------------------------------------------- |
| `HOSTINGER_VM_ID`          | Yes      | —                              | VPS id from hPanel URL                                            |
| `NEXT_PUBLIC_FRONTEND_URL` | Yes      | —                              | Public URL, e.g. `https://focus-on-pixel.com` (no trailing slash) |
| `NEXT_PUBLIC_API_URL`      | No       | —                              | Baked into the image at build time if set                         |
| `FRONTEND_PORT`            | No       | `3000`                         | Loopback port on the VPS                                          |
| `HOSTINGER_COMPOSE_FILE`   | No       | `docker-compose.hostinger.yml` | Compose path for Hostinger action                                 |
| `VPS_PRUNE_KEEP_UNUSED`    | No       | `1`                            | Unused images kept per pattern (`post-deploy-prune`)              |
| `GHCR_PRUNE_KEEP_VERSIONS` | No       | `2`                            | Recent SHA tags kept on GHCR (`prune-ghcr` job)                   |

`GITHUB_TOKEN` is used automatically for GHCR push and registry prune — no extra PAT in GitHub
Secrets.

### Private repo

Add a
[Hostinger deploy SSH key](https://www.hostinger.com/support/how-to-deploy-from-private-github-repository-on-hostinger-docker-manager/)
if Hostinger must clone the repo on the VPS. Runtime images still come from GHCR.

## One-time VPS setup

### GHCR login (required for private packages)

On the VPS (once; often already done for MemoOn-Card):

```bash
echo "github_pat_xxx" | sudo docker login ghcr.io -u "your-github-user" --password-stdin
```

PAT scope: **`read:packages`**. Do not commit the PAT.

Package after first successful deploy: `ghcr.io/<owner>/portfolio-frontend` (keep private).

### Docker daemon tuning (once per host)

If not already run for another project on the same VPS:

```bash
sudo bash scripts/hostinger-vps-docker-tuning.sh
```

Serializes layer downloads during pulls. **Do not re-run** unless you know you need to change
`/etc/docker/daemon.json`.

### Host nginx

TLS and routing: `tools/nginx/examples/focus-on-pixel.com.conf` → proxy to `127.0.0.1:3000`.

## First deploy

1. Ensure CI passes on `main`.
2. **Actions → Deploy landing to Hostinger → Run workflow**
3. Check **`force_full`** (baseline cache is empty).
4. Wait for `build-and-push` → `deploy` → `prune-ghcr` → `record-deploy`.
5. Verify:
   - `https://focus-on-pixel.com/fr`
   - `docker ps` → `portfolio_frontend_deploy` running
   - `docker logs portfolio-post-deploy-prune-1` (or similar) → prune summary

## Later deploys

- Run workflow manually after CI green.
- **Path filter**: only rebuilds when `apps/frontend`, shared packages, lockfile, or hostinger
  compose/workflow changed.
- **`force_full`**: rebuild and redeploy regardless of diff.
- **`ref`**: deploy another branch/tag/SHA.

## Shared VPS (MemoOn-Card, VatMan, …)

- Project directory: `/docker/portfolio` (`project-name: portfolio`).
- Container: `portfolio_frontend_deploy` on port **3000** (MemoOn uses **3002** / **4002**).
- Prune is **scoped** to `ghcr.io/*/portfolio-frontend` and containers named `portfolio` — it does
  not remove other stacks.
- Never run `docker system prune -a` on a shared VPS.

## Manual SSH

```bash
cd /docker/portfolio
docker compose -f docker-compose.hostinger.yml ps
docker logs --tail 80 portfolio_frontend_deploy
docker logs portfolio-post-deploy-prune-1
```

Prune images manually:

```bash
bash scripts/vps-prune-project-images.sh
DRY_RUN=1 bash scripts/vps-prune-project-images.sh
```

Emergency rebuild on VPS (slow on small VPS):

```bash
docker compose -f docker-compose.deploy.yml up -d --build
```

## Troubleshooting

| Symptom                                                   | Check                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `pull access denied` for `ghcr.io/.../portfolio-frontend` | `docker login ghcr.io` on VPS with `read:packages` PAT                |
| Deploy job ~7s but site unchanged                         | Pull still running on VPS; check `docker events` / Hostinger logs     |
| `post-deploy-prune` exits non-zero                        | Logs must use POSIX `sh` only (no `bash` / `apk` in compose)          |
| Workflow skips deploy                                     | No landing-related diff since last deploy; use **`force_full`**       |
| Old `portfolio-frontend:latest` local image               | Normal after migration; `post-deploy-prune` cleans GHCR-tagged images |

## Validate compose locally

```bash
FRONTEND_IMAGE=ghcr.io/example/portfolio-frontend \
FRONTEND_IMAGE_TAG=dev \
docker compose -f docker-compose.hostinger.yml config
```
