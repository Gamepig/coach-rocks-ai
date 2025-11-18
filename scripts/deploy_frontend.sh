#!/usr/bin/env bash
# Frontend 部署腳本
# 用途: 部署 Cloudflare Pages Frontend

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }

cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" || exit 1

PROJECT_NAME="${CF_PAGES_PROJECT:-coach-rocks-frontend}"
BACKEND_URL="${BACKEND_URL:-}"

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

# 2. 設定環境變數
if [[ -z "$BACKEND_URL" ]]; then
  # 嘗試從 wrangler 取得 backend URL
  ACCOUNT_ID=$(wrangler whoami | grep Account | awk '{print $NF}' || echo "")
  BACKEND_URL="https://coach-backend.${ACCOUNT_ID}.workers.dev"
fi

log "Setting environment variables..."
cat > .env.production << EOF
VITE_BACKEND_BASE_URL=$BACKEND_URL
VITE_API_ROOT=$BACKEND_URL/api
VITE_API_OPENAI_BASE=$BACKEND_URL/api/openai
VITE_DEMO_MODE=false
EOF

log "Environment variables:"
cat .env.production

# 3. 安裝相依
log "Installing dependencies..."
npm install

# 4. 執行測試（可選，不阻擋部署）
if grep -q '"test"' package.json; then
  log "Running tests..."
  npm test || warn "Tests failed, but continuing deployment..."
fi

# 5. Build
log "Building frontend..."
npm run build || {
  err "Build failed"
  exit 1
}

# 6. 檢查 build 輸出
if [[ ! -d "dist" ]]; then
  err "Build output 'dist' directory not found"
  exit 1
fi

# 7. 建立 Pages 專案（如果不存在）
log "Checking Pages project..."
if ! wrangler pages project list 2>/dev/null | grep -q "$PROJECT_NAME"; then
  log "Creating Cloudflare Pages project: $PROJECT_NAME"
  wrangler pages project create "$PROJECT_NAME" \
    --production-branch main \
    --deployment-trigger none || {
    warn "Failed to create project (may already exist)"
  }
fi

# 8. 部署到 Pages
log "Deploying to Cloudflare Pages..."
wrangler pages deploy dist \
  --project-name="$PROJECT_NAME" \
  --branch=main || {
  err "Pages deployment failed"
  exit 1
}

# 9. 取得部署 URL
PAGES_URL="https://${PROJECT_NAME}.pages.dev"
log "Deployed to: $PAGES_URL"

# 10. 健康檢查
log "Running health check..."
if curl -f -s "$PAGES_URL" >/dev/null 2>&1; then
  log "Health check passed!"
else
  warn "Health check failed (page may not be ready yet)"
fi

log "Frontend deployment completed successfully!"

