#!/usr/bin/env bash
# Delete old GHCR package versions for Portfolio packages only.
# Keeps :latest, the N most recent SHA tags, and tags listed in DEPLOYED_TAGS.
#
# Invoked by deploy-hostinger.yml (job prune-ghcr). See documentation/DEPLOYMENT-HOSTINGER.md.
set -euo pipefail

KEEP_VERSIONS="${KEEP_VERSIONS:-2}"
DEPLOYED_TAGS="${DEPLOYED_TAGS:-}"
REPO="${GITHUB_REPOSITORY:?Set GITHUB_REPOSITORY (owner/repo)}"
OWNER="${REPO%%/*}"

if [[ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  echo "GH_TOKEN or GITHUB_TOKEN required" >&2
  exit 1
fi
export GH_TOKEN="${GH_TOKEN:-$GITHUB_TOKEN}"

if [[ -z "${PACKAGE_NAMES:-}" ]]; then
  PACKAGE_NAMES=(portfolio-frontend)
else
  # shellcheck disable=SC2206
  PACKAGE_NAMES=($PACKAGE_NAMES)
fi

is_protected_tag() {
  local tag=$1
  [[ "$tag" == "latest" ]] && return 0
  for t in $DEPLOYED_TAGS; do
    [[ -n "$t" && "$tag" == "$t" ]] && return 0
  done
  return 1
}

prune_package() {
  local pkg=$1
  echo "==> GHCR prune: $OWNER/$pkg (keep $KEEP_VERSIONS recent versions + latest + deployed)"

  local api_base
  if gh api "/orgs/${OWNER}/packages/container/${pkg}/versions?per_page=1" >/dev/null 2>&1; then
    api_base="/orgs/${OWNER}/packages/container/${pkg}"
  else
    api_base="/users/${OWNER}/packages/container/${pkg}"
  fi

  mapfile -t versions < <(
    gh api \
      -H "Accept: application/vnd.github+json" \
      "${api_base}/versions?per_page=100" \
      --paginate \
      --jq '.[] | select(.metadata.container.tags | length > 0) | [.id, (.metadata.container.tags[0]), (.updated_at)] | @tsv' \
      2>/dev/null \
      | sort -t$'\t' -k3 -r || true
  )

  if ((${#versions[@]} == 0)); then
    echo "    No versions found (package missing or no access)."
    return 0
  fi

  protected=()
  candidates=()

  for row in "${versions[@]}"; do
    id="${row%%$'\t'*}"
    rest="${row#*$'\t'}"
    tag="${rest%%$'\t'*}"

    if is_protected_tag "$tag"; then
      protected+=("$id:$tag")
    else
      candidates+=("$id:$tag")
    fi
  done

  echo "    protected: ${protected[*]:-none}"

  kept=0
  deleted=0
  for entry in "${candidates[@]}"; do
    id="${entry%%:*}"
    tag="${entry#*:}"

    if ((kept < KEEP_VERSIONS)); then
      echo "    keep (recent): $tag"
      kept=$((kept + 1))
      continue
    fi

    echo "    delete: $tag (version id $id)"
    gh api \
      -X DELETE \
      -H "Accept: application/vnd.github+json" \
      "${api_base}/versions/${id}" \
      >/dev/null 2>&1 || echo "    warn: failed to delete $tag"
    deleted=$((deleted + 1))
  done

  echo "    summary: kept $kept recent, deleted $deleted"
}

for pkg in "${PACKAGE_NAMES[@]}"; do
  prune_package "$pkg"
done

echo "==> GHCR prune complete"
