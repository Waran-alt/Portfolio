#!/usr/bin/env bash
# One-time VPS tuning for Hostinger Docker Manager (run as root over SSH).
# Goals:
#   - Throttle concurrent layer downloads (less CPU/disk spike during image pull/build)
#   - Optional: persist daemon.json merge without wiping existing keys
#
# Shared VPS: safe to run once per host (benefits Portfolio, MemoOn-Card, and other stacks).
#
# Usage:
#   sudo bash scripts/hostinger-vps-docker-tuning.sh
#
# After changing daemon.json, Docker restarts briefly (running containers restart on next deploy).
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

DAEMON_JSON="/etc/docker/daemon.json"
BACKUP="${DAEMON_JSON}.bak.$(date +%Y%m%d%H%M%S)"

mkdir -p /etc/docker
if [[ -f "$DAEMON_JSON" ]]; then
  cp "$DAEMON_JSON" "$BACKUP"
  echo "Backed up existing daemon.json to $BACKUP"
fi

python3 - <<'PY'
import json
from pathlib import Path

path = Path("/etc/docker/daemon.json")
data = {}
if path.exists():
    data = json.loads(path.read_text() or "{}")

# Serial pulls reduce sustained CPU during large downloads on small VPS disks.
data["max-concurrent-downloads"] = 1
data["max-concurrent-uploads"] = 1
data.setdefault("log-driver", "json-file")
data.setdefault("log-opts", {"max-size": "10m", "max-file": "3"})

path.write_text(json.dumps(data, indent=2) + "\n")
print("Wrote", path)
PY

if command -v systemctl >/dev/null 2>&1; then
  systemctl restart docker
  echo "Docker restarted."
else
  service docker restart
  echo "Docker restarted (service)."
fi

echo
echo "Done. Per-container CPU caps are set in docker-compose.deploy.yml and docker-compose.prod.yml."
echo "Re-deploy from GitHub after the next push to apply compose changes on the VPS."
