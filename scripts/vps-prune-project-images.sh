#!/usr/bin/env bash
# Remove unused Docker images for Portfolio only (default: portfolio-frontend GHCR images).
# Does not run global `docker image prune -a` — other stacks on the VPS are untouched.
#
# Usage (manual SSH; automatic prune is inlined in docker-compose.hostinger.yml post-deploy-prune):
#   bash scripts/vps-prune-project-images.sh
#   KEEP_UNUSED=1 PROJECT_SLUG=portfolio bash scripts/vps-prune-project-images.sh
#
# Env:
#   PROJECT_SLUG     — compose project / container name prefix (default: portfolio)
#   KEEP_UNUSED      — unused images to keep per pattern for rollback (default: 1)
#   IMAGE_PATTERNS   — space-separated repo prefixes (default: portfolio GHCR image)
#   DRY_RUN          — set to 1 to print removals without deleting
set -euo pipefail

PROJECT_SLUG="${PROJECT_SLUG:-portfolio}"
KEEP_UNUSED="${KEEP_UNUSED:-1}"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "${IMAGE_PATTERNS:-}" ]]; then
  IMAGE_PATTERNS=("ghcr.io/*/portfolio-frontend")
else
  # shellcheck disable=SC2206
  IMAGE_PATTERNS=($IMAGE_PATTERNS)
fi

if ! [[ "$KEEP_UNUSED" =~ ^[0-9]+$ ]]; then
  echo "KEEP_UNUSED must be a non-negative integer (got: $KEEP_UNUSED)" >&2
  exit 1
fi

echo "==> Prune project images: $PROJECT_SLUG (KEEP_UNUSED=$KEEP_UNUSED, DRY_RUN=$DRY_RUN)"

in_use_ids() {
  docker ps -a \
    --filter "name=${PROJECT_SLUG}" \
    --format '{{.Image}}' 2>/dev/null \
    | while read -r ref; do
        [[ -n "$ref" ]] || continue
        docker image inspect --format '{{.Id}}' "$ref" 2>/dev/null || true
      done \
    | sort -u
}

IN_USE="$(in_use_ids | tr '\n' ' ')"
echo "    Images in use by ${PROJECT_SLUG} containers: $(echo "$IN_USE" | wc -w | tr -d ' ')"

removed=0
kept=0

for pattern in "${IMAGE_PATTERNS[@]}"; do
  mapfile -t rows < <(
    docker image ls "$pattern" --format '{{.ID}}\t{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}' 2>/dev/null \
      | sort -t$'\t' -k3 -r || true
  )

  if ((${#rows[@]} == 0)); then
    echo "    No images for pattern: $pattern"
    continue
  fi

  unused_kept=0
  for row in "${rows[@]}"; do
    id="${row%%$'\t'*}"
    rest="${row#*$'\t'}"
    ref="${rest%%$'\t'*}"

    if [[ " $IN_USE " == *" $id "* ]]; then
      echo "    keep (in use): $ref"
      kept=$((kept + 1))
      continue
    fi

    if ((unused_kept < KEEP_UNUSED)); then
      echo "    keep (history): $ref"
      unused_kept=$((unused_kept + 1))
      kept=$((kept + 1))
      continue
    fi

    if [[ "$DRY_RUN" == "1" ]]; then
      echo "    would remove: $ref ($id)"
    else
      echo "    remove: $ref"
      docker rmi "$ref" 2>/dev/null || docker rmi -f "$id" 2>/dev/null || true
    fi
    removed=$((removed + 1))
  done
done

if [[ "$DRY_RUN" == "1" ]]; then
  dangling=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l | tr -d ' ')
  echo "    dangling layers (not removed in dry-run): $dangling"
else
  docker image prune -f >/dev/null 2>&1 || true
fi

echo "==> Done: kept=$kept removed=$removed"
