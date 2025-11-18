#!/usr/bin/env bash
set -euo pipefail

log() { printf '\033[1;34m[%s]\033[0m %s\n' "$(date '+%H:%M:%S')" "$*"; }
err() { printf '\033[1;31m[%s] ERROR\033[0m %s\n' "$(date '+%H:%M:%S')" "$*" >&2; }

REPO_URL="${REPO_URL:-https://gitlab.com/coach-rocks/coach-rocks.git}"
BRANCH="${BRANCH:-main}"
PROJECT_NAME="${CF_PAGES_PROJECT:-coach-rocks-demo}"
TEMP_ROOT="${WORKDIR:-$(mktemp -d /tmp/coach-rocks-pages.XXXXXX)}"
KEEP_WORKDIR="${KEEP_WORKDIR:-false}"
NPM_CLIENT="${NPM_CLIENT:-npm}"

VITE_API_ROOT="${VITE_API_ROOT:-}"
VITE_API_OPENAI_BASE="${VITE_API_OPENAI_BASE:-}"
VITE_DEMO_MODE="${VITE_DEMO_MODE:-true}"

cleanup() {
  if [[ "$KEEP_WORKDIR" != "true" && -d "$TEMP_ROOT" ]]; then
    rm -rf "$TEMP_ROOT"
  else
    log "Working directory preserved at $TEMP_ROOT"
  fi
}
trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' not found in PATH"
    exit 1
  fi
}

require_cmd git
require_cmd "$NPM_CLIENT"
require_cmd wrangler

log "Cloning $REPO_URL (branch: $BRANCH)"
git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$TEMP_ROOT/repo"

pushd "$TEMP_ROOT/repo/frontend" >/dev/null

log "Installing dependencies via $NPM_CLIENT"
if [[ "$NPM_CLIENT" == "npm" ]]; then
  npm install
else
  "$NPM_CLIENT" install
fi

ENV_FILE="$TEMP_ROOT/repo/frontend/.env.production"
if [[ -n "$VITE_API_ROOT" || -n "$VITE_API_OPENAI_BASE" || -n "$VITE_DEMO_MODE" ]]; then
  log "Writing Vite environment variables to .env.production"
  {
    [[ -n "$VITE_API_ROOT" ]] && echo "VITE_API_ROOT=$VITE_API_ROOT"
    [[ -n "$VITE_API_OPENAI_BASE" ]] && echo "VITE_API_OPENAI_BASE=$VITE_API_OPENAI_BASE"
    [[ -n "$VITE_DEMO_MODE" ]] && echo "VITE_DEMO_MODE=$VITE_DEMO_MODE"
  } > "$ENV_FILE"
fi

log "Building frontend"
if [[ "$NPM_CLIENT" == "npm" ]]; then
  npm run build
else
  "$NPM_CLIENT" run build
fi

if ! wrangler pages project list | grep -q " $PROJECT_NAME\$"; then
  log "Creating Cloudflare Pages project '$PROJECT_NAME'"
  wrangler pages project create "$PROJECT_NAME" --production-branch "$BRANCH" --deployment-trigger none
fi

log "Deploying dist/ to Cloudflare Pages project '$PROJECT_NAME'"
wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch "$BRANCH"

popd >/dev/null
log "Deployment script completed successfully."
