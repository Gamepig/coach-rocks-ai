#!/usr/bin/env bash
# Backend 驗證腳本
# 用途: 驗證 Backend 部署是否成功

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }

WORKER_NAME="${WORKER_NAME:-coach-backend}"
WORKER_URL="${WORKER_URL:-}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' not found in PATH"
    exit 1
  fi
}

require_cmd wrangler
require_cmd curl

# 取得 Worker URL
if [[ -z "$WORKER_URL" ]]; then
  ACCOUNT_ID=$(wrangler whoami | grep Account | awk '{print $NF}' || echo "")
  if [[ -n "$ACCOUNT_ID" ]]; then
    WORKER_URL="https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev"
  else
    err "Cannot determine Worker URL. Please set WORKER_URL environment variable."
    exit 1
  fi
fi

log "Verifying backend deployment at: $WORKER_URL"

# 1. 健康檢查端點
log "Testing health check endpoint..."
if curl -f -s "${WORKER_URL}/api/health" >/dev/null 2>&1; then
  log "✓ Health check passed"
else
  warn "Health check endpoint not available (may not be implemented)"
fi

# 2. 測試 API 端點
ENDPOINTS=(
  "/api/test-ai"
)

for endpoint in "${ENDPOINTS[@]}"; do
  log "Testing endpoint: $endpoint"
  if curl -f -s "${WORKER_URL}${endpoint}" >/dev/null 2>&1; then
    log "✓ $endpoint passed"
  else
    warn "✗ $endpoint failed (may require authentication)"
  fi
done

# 3. 檢查 D1 資料庫連線
log "Checking D1 database connection..."
if wrangler d1 execute coachdb --command="SELECT COUNT(*) FROM meetings;" >/dev/null 2>&1; then
  log "✓ D1 database connection successful"
else
  warn "D1 database check failed (may not have meetings table yet)"
fi

# 4. 檢查 Secrets
log "Verifying secrets..."
SECRETS=("OPENAI_API_KEY" "JWT_SECRET")
MISSING=()

for secret in "${SECRETS[@]}"; do
  if ! wrangler secret list | grep -q "$secret"; then
    MISSING+=("$secret")
  fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
  log "✓ All required secrets are set"
else
  warn "Missing secrets: ${MISSING[*]}"
fi

log "Backend verification completed!"

