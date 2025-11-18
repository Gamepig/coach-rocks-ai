#!/usr/bin/env bash
# 修復 localhost:8787 問題 - 更新 Cloudflare Workers Secrets
# 用途: 更新 GOOGLE_REDIRECT_URI 和 BACKEND_URL secrets

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

# 正確的配置值
CORRECT_BACKEND_URL="https://coach-backend.gamepig1976.workers.dev"
CORRECT_REDIRECT_URI="${CORRECT_BACKEND_URL}/api/auth/google/callback"

log "修復 localhost:8787 問題 - 更新 Cloudflare Workers Secrets"
log "=========================================================="
echo ""

warn "⚠️  重要說明："
echo "  - Cloudflare Workers Secrets 會覆蓋 .dev.vars 設定"
echo "  - 即使 .dev.vars 已更新，如果 secrets 中還有 localhost:8787，後端仍會使用舊值"
echo "  - 此腳本會更新 secrets 為正確的生產環境 URL"
echo ""

info "正確的配置值："
echo "  BACKEND_URL: ${CORRECT_BACKEND_URL}"
echo "  GOOGLE_REDIRECT_URI: ${CORRECT_REDIRECT_URI}"
echo ""

# 檢查是否在正確的目錄
if [[ ! -f "wrangler.jsonc" ]]; then
  err "錯誤：找不到 wrangler.jsonc，請確認在 backend 目錄中執行此腳本"
  exit 1
fi

# 更新 GOOGLE_REDIRECT_URI
log "步驟 1: 更新 GOOGLE_REDIRECT_URI secret"
echo ""
echo "請輸入以下值（直接複製貼上）："
echo "${CORRECT_REDIRECT_URI}"
echo ""
read -p "按 Enter 繼續更新 GOOGLE_REDIRECT_URI..." -r
echo ""

if echo "${CORRECT_REDIRECT_URI}" | wrangler secret put GOOGLE_REDIRECT_URI; then
  log "✅ GOOGLE_REDIRECT_URI 已更新"
else
  err "❌ 更新 GOOGLE_REDIRECT_URI 失敗"
  exit 1
fi

echo ""

# 更新 BACKEND_URL
log "步驟 2: 更新 BACKEND_URL secret"
echo ""
echo "請輸入以下值（直接複製貼上）："
echo "${CORRECT_BACKEND_URL}"
echo ""
read -p "按 Enter 繼續更新 BACKEND_URL..." -r
echo ""

if echo "${CORRECT_BACKEND_URL}" | wrangler secret put BACKEND_URL; then
  log "✅ BACKEND_URL 已更新"
else
  err "❌ 更新 BACKEND_URL 失敗"
  exit 1
fi

echo ""
log "✅ 所有 secrets 已更新完成！"
echo ""

warn "⚠️  下一步操作："
echo "  1. 如果後端正在運行，請重啟後端（Ctrl+C 停止，然後 npm run dev）"
echo "  2. 確認 Google Cloud Console 中的 Authorized Redirect URIs："
echo "     - 必須包含：${CORRECT_REDIRECT_URI}"
echo "     - 必須移除：http://localhost:8787/api/auth/google/callback"
echo "  3. 清除瀏覽器快取和 cookies"
echo "  4. 重新測試 OAuth 登入"
echo ""

info "Google Cloud Console 連結："
echo "  https://console.cloud.google.com/apis/credentials"
echo ""

