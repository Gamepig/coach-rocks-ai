#!/usr/bin/env bash
# 檢查 Cloudflare Pages 環境變數設定
# 用途: 檢查 VITE_BACKEND_BASE_URL 是否正確設定

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO${NC} $*"; }

PROJECT_NAME="${CF_PAGES_PROJECT:-coach-rocks-frontend}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-9288c023577aa2f6ce20582b6c4bdda0}"
EXPECTED_BACKEND_URL="https://coach-backend.gamepig1976.workers.dev"

log "檢查 Cloudflare Pages 環境變數設定"
log "專案名稱: $PROJECT_NAME"
log "Account ID: $ACCOUNT_ID"
log "預期後端 URL: $EXPECTED_BACKEND_URL"
echo ""

# 方法 1: 檢查 Cloudflare Dashboard
info "方法 1: 透過 Cloudflare Dashboard 檢查"
echo "1. 登入 Cloudflare Dashboard: https://dash.cloudflare.com"
echo "2. 前往: Pages → $PROJECT_NAME → Settings → Environment Variables"
echo "3. 檢查是否有設定: VITE_BACKEND_BASE_URL = $EXPECTED_BACKEND_URL"
echo ""

# 方法 2: 檢查生產環境的實際值
info "方法 2: 檢查生產環境的實際值"
PROD_URL="https://coach-rocks-frontend.pages.dev"
echo "在生產環境的瀏覽器 Console 中執行："
echo ""
echo "  console.log('VITE_BACKEND_BASE_URL:', import.meta.env.VITE_BACKEND_BASE_URL)"
echo ""
echo "預期結果: $EXPECTED_BACKEND_URL"
echo "如果顯示 undefined → ⚠️ 環境變數未設定（禁止使用 localhost:8787 fallback，詳見 PROJECT_RULES.md）"
echo ""

# 方法 3: 檢查最近的部署
info "方法 3: 檢查最近的部署"
if command -v wrangler >/dev/null 2>&1; then
  export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
  log "最近的 Production 部署:"
  wrangler pages deployment list --project-name="$PROJECT_NAME" 2>&1 | grep "Production" | head -1 || warn "無法取得部署資訊"
  echo ""
  
  log "最近的部署 URL:"
  LATEST_DEPLOYMENT=$(wrangler pages deployment list --project-name="$PROJECT_NAME" 2>&1 | grep "Production" | head -1 | awk '{print $NF}' || echo "")
  if [[ -n "$LATEST_DEPLOYMENT" ]]; then
    echo "  $LATEST_DEPLOYMENT"
    echo ""
    info "可以在該部署的瀏覽器 Console 中檢查環境變數"
  fi
else
  warn "wrangler 未安裝，跳過部署檢查"
fi

echo ""
log "檢查完成"
echo ""
warn "⚠️ 重要提醒:"
echo "  - Vite 環境變數是在建置時注入的，不是運行時"
echo "  - 如果環境變數未設定，必須明確設定（禁止使用 localhost:8787 fallback，詳見 PROJECT_RULES.md）"
echo "  - 使用 localhost:8787 會導致 OAuth redirect_uri_mismatch 錯誤"
echo ""
info "如果環境變數未設定，需要："
echo "  1. 在 Cloudflare Dashboard 設定環境變數"
echo "  2. 重新部署前端應用"
echo ""

