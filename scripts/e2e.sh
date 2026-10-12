#!/usr/bin/env bash
# Container-level verification: HTTP smoke checks plus Playwright browser checks.
#
#   scripts/e2e.sh                      build the image, start web on 127.0.0.1:3000, verify, stop
#   KEEP_RUNNING=1 scripts/e2e.sh       leave the container running afterwards
#   E2E_BASE_URL=<url> scripts/e2e.sh   verify an already running instance instead
#   scripts/e2e.sh --grep "404"         extra arguments go to `playwright test`
#
# The browser checks run inside the official Playwright image matching the
# installed @playwright/test, on the host network, so the container under test
# stays bound to loopback.
set -euo pipefail

cd "$(dirname "$0")/.."

PLAYWRIGHT_VERSION="$(node -p "require('@playwright/test/package.json').version")"
PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"
BASE_URL="${E2E_BASE_URL:-http://127.0.0.1:3000}"
COMPOSE=(docker compose -f compose.yaml -f compose.local.yaml)

stop_container() {
  if [ "${KEEP_RUNNING:-0}" != "1" ]; then
    "${COMPOSE[@]}" down --remove-orphans >/dev/null
  fi
}

if [ -z "${E2E_BASE_URL:-}" ]; then
  "${COMPOSE[@]}" up -d --build web
  trap stop_container EXIT
  for _ in $(seq 1 60); do
    if curl -fsS "${BASE_URL}/healthz" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  curl -fsS "${BASE_URL}/healthz" >/dev/null
fi

npm run --silent smoke -- "${BASE_URL}"

# Mounted read-write as in Playwright's Docker guide: the runner deletes and
# recreates test-results/ and playwright-report/ in the project root, which a
# read-only checkout would forbid. The image is Microsoft's official one, chosen
# by the version of @playwright/test.
docker run --rm --network host --ipc host --init \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e CI="${CI:-}" \
  -e E2E_BASE_URL="${BASE_URL}" \
  -v "${PWD}:/work" -w /work \
  "${PLAYWRIGHT_IMAGE}" \
  npx playwright test "$@"
