#!/usr/bin/env bash
# Google OAuth redirect_uri 修復腳本
# 用途: 協助修復 redirect_uri_mismatch 錯誤

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

cd "$(dirname "${BASH_SOURCE[0]}")/../backend" || exit 1

# 獲取 Worker URL
WORKER_URL="https://coach-backend.gamepig1976.workers.dev"
CORRECT_REDIRECT_URI="${WORKER_URL}/api/auth/google/callback"

log "Google OAuth redirect_uri 修復工具"
log "=================================="
echo ""

info "正確的 redirect URI 應該是："
echo "  ${CORRECT_REDIRECT_URI}"
echo ""

warn "⚠️  注意：無法直接查看 Cloudflare Workers secrets"
warn "⚠️  請手動確認 GOOGLE_REDIRECT_URI 是否設定正確"
echo ""

log "修復步驟："
echo ""
echo "1. 更新 Google Cloud Console："
echo "   - 前往：https://console.cloud.google.com/apis/credentials"
echo "   - 找到您的 OAuth 2.0 客戶端"
echo "   - 在「Authorized redirect URIs」中添加："
echo "     ${CORRECT_REDIRECT_URI}"
echo ""
echo "2. 確認後端環境變數（如果需要更新）："
echo "   cd backend"
echo "   wrangler secret put GOOGLE_REDIRECT_URI"
echo "   輸入：${CORRECT_REDIRECT_URI}"
echo ""
echo "3. 等待 10-30 秒讓 Google Cloud Console 變更生效"
echo ""
echo "4. 清除瀏覽器快取和 cookies，然後重新測試"
echo ""

read -p "是否要更新後端環境變數 GOOGLE_REDIRECT_URI？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  log "更新 GOOGLE_REDIRECT_URI..."
  echo "請輸入以下值："
  echo "${CORRECT_REDIRECT_URI}"
  echo ""
  wrangler secret put GOOGLE_REDIRECT_URI
  log "✅ GOOGLE_REDIRECT_URI 已更新"
else
  info "跳過環境變數更新"
fi

echo ""
log "下一步："
echo "1. 前往 Google Cloud Console 更新 Authorized redirect URIs"
echo "2. 等待 10-30 秒"
echo "3. 清除瀏覽器快取並重新測試"
echo ""
log "完成！"

