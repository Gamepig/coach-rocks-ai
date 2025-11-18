#!/usr/bin/env bash
# 部署後設定腳本
# 用途: 協助完成部署後的必要調整

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

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' not found in PATH"
    exit 1
  fi
}

require_cmd wrangler

# 檢查是否已登入
if ! wrangler whoami >/dev/null 2>&1; then
  err "Not logged in to Cloudflare. Run 'wrangler login' first."
  exit 1
fi

# 取得實際的 URL
log "Getting deployment URLs..."

ACCOUNT_ID=$(wrangler whoami | grep Account | awk '{print $NF}' || echo "")
if [[ -z "$ACCOUNT_ID" ]]; then
  err "Cannot determine Account ID"
  exit 1
fi

WORKER_NAME="coach-backend"
PAGES_NAME="coach-rocks-frontend"

WORKER_URL="https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev"
PAGES_URL="https://${PAGES_NAME}.pages.dev"

log "Detected URLs:"
info "  Backend Worker: $WORKER_URL"
info "  Frontend Pages: $PAGES_URL"

# 顯示需要調整的項目
log "=========================================="
log "Post-Deployment Adjustment Checklist"
log "=========================================="
echo ""
info "The following items need to be adjusted after deployment:"
echo ""
echo "1. ✅ Backend Secrets (use wrangler secret put):"
echo "   - BACKEND_URL: $WORKER_URL"
echo "   - FRONTEND_URL: $PAGES_URL"
echo "   - GOOGLE_REDIRECT_URI: ${WORKER_URL}/api/auth/google/callback"
echo "   - ZOOM_REDIRECT_URI: ${PAGES_URL}/auth/zoom/callback"
echo ""
echo "2. ✅ CORS Settings (edit backend/src/index.ts):"
echo "   - Add: env.FRONTEND_URL"
echo "   - Add: '$PAGES_URL'"
echo "   - Then redeploy: cd backend && npm run deploy"
echo ""
echo "3. ✅ Google Cloud Console OAuth:"
echo "   - Add redirect URI: ${WORKER_URL}/api/auth/google/callback"
echo "   - URL: https://console.cloud.google.com/apis/credentials"
echo ""
echo "4. ✅ Zoom Marketplace OAuth:"
echo "   - Add redirect URL: ${PAGES_URL}/auth/zoom/callback"
echo "   - URL: https://marketplace.zoom.us/develop/create"
echo ""
echo "5. ✅ Frontend Environment Variables (Cloudflare Pages Dashboard):"
echo "   - VITE_API_ROOT: ${WORKER_URL}/api"
echo "   - VITE_API_OPENAI_BASE: ${WORKER_URL}/api/openai"
echo "   - Then redeploy Frontend"
echo ""
log "=========================================="
log "Quick Setup Commands"
log "=========================================="
echo ""
echo "# Update Backend Secrets:"
echo "wrangler secret put BACKEND_URL"
echo "# Enter: $WORKER_URL"
echo ""
echo "wrangler secret put FRONTEND_URL"
echo "# Enter: $PAGES_URL"
echo ""
echo "wrangler secret put GOOGLE_REDIRECT_URI"
echo "# Enter: ${WORKER_URL}/api/auth/google/callback"
echo ""
echo "wrangler secret put ZOOM_REDIRECT_URI"
echo "# Enter: ${PAGES_URL}/auth/zoom/callback"
echo ""
log "=========================================="
log "For detailed instructions, see:"
log "  documents/post_deployment_adjustments.md"
log "=========================================="

