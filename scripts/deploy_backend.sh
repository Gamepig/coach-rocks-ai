#!/usr/bin/env bash
# Backend 部署腳本
# 用途: 部署 Cloudflare Workers Backend

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }

cd "$(dirname "${BASH_SOURCE[0]}")/../backend" || exit 1

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' not found in PATH"
    exit 1
  fi
}

require_cmd wrangler
require_cmd node
require_cmd npm

# 前置檢查
log "Running pre-deployment checks..."

# 1. 檢查是否已登入
if ! wrangler whoami >/dev/null 2>&1; then
  err "Not logged in to Cloudflare. Run 'wrangler login' first."
  exit 1
fi

# 2. 檢查 TypeScript 編譯（如果有 type-check 腳本）
if grep -q '"type-check"' package.json; then
  log "Running TypeScript type check..."
  npm run type-check || {
    err "TypeScript compilation failed"
    exit 1
  }
fi

# 3. 驗證 D1 資料庫綁定
log "Verifying D1 database binding..."
if ! wrangler d1 list | grep -q "coachdb"; then
  err "D1 database 'coachdb' not found. Run './scripts/setup_d1.sh' first."
  exit 1
fi

# 4. 檢查必要 Secrets
log "Checking required secrets..."
REQUIRED_SECRETS=("OPENAI_API_KEY" "JWT_SECRET")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  if ! wrangler secret list | grep -q "$secret"; then
    MISSING_SECRETS+=("$secret")
  fi
done

if [[ ${#MISSING_SECRETS[@]} -gt 0 ]]; then
  err "Missing required secrets: ${MISSING_SECRETS[*]}"
  err "Run './scripts/setup_secrets.sh' to set secrets"
  exit 1
fi

# 5. 安裝相依
log "Installing dependencies..."
npm install

# 6. 執行部署
log "Deploying to Cloudflare Workers..."
npm run deploy || {
  err "Deployment failed"
  exit 1
}

# 7. 取得部署 URL
log "Getting deployment URL..."
WORKER_URL=$(wrangler deployments list | head -n 2 | tail -n 1 | awk '{print $NF}' || echo "")
if [[ -z "$WORKER_URL" ]]; then
  # 嘗試從 wrangler.jsonc 取得名稱
  WORKER_NAME=$(grep -oP '"name":\s*"\K[^"]+' wrangler.jsonc | head -n 1 || echo "coach-backend")
  ACCOUNT_ID=$(wrangler whoami | grep Account | awk '{print $NF}' || echo "")
  WORKER_URL="https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev"
fi

log "Deployed to: $WORKER_URL"

# 8. 健康檢查（可選）
if [[ -n "$WORKER_URL" ]]; then
  log "Running health check..."
  if curl -f -s "${WORKER_URL}/api/health" >/dev/null 2>&1; then
    log "Health check passed!"
  else
    warn "Health check failed (endpoint may not exist)"
  fi
fi

log "Backend deployment completed successfully!"

