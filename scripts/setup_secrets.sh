#!/usr/bin/env bash
# Secrets 設定腳本
# 用途: 批次設定 Cloudflare Workers Secrets
# 注意: 此腳本需要手動提供 Secrets 值（無法完全自動化）

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

ENV_FILE="${ENV_FILE:-.env.production}"

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

# Secrets 清單
declare -a SECRETS=(
  "OPENAI_API_KEY"
  "PERPLEXITY_API_KEY"
  "SERPER_API_KEY"
  "JWT_SECRET"
  "GMAIL_SMTP_USER"
  "GMAIL_SMTP_PASSWORD"
  "FROM_EMAIL"
  "APP_NAME"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_REDIRECT_URI"
  "ZOOM_CLIENT_ID"
  "ZOOM_CLIENT_SECRET"
  "ZOOM_REDIRECT_URI"
  "BACKEND_URL"
  "FRONTEND_URL"
)

# 從環境變數或 .env 檔案讀取
if [[ -f "$ENV_FILE" ]]; then
  log "Loading secrets from $ENV_FILE..."
  set -a
  source "$ENV_FILE"
  set +a
fi

# 設定 Secrets
log "Setting Cloudflare Workers secrets..."
log "Note: You will be prompted to enter each secret value"

for secret in "${SECRETS[@]}"; do
  # 檢查環境變數是否已設定
  if [[ -n "${!secret:-}" ]]; then
    info "Setting secret: $secret (from environment)"
    echo "${!secret}" | wrangler secret put "$secret" || {
      warn "Failed to set $secret, skipping..."
    }
  else
    warn "$secret not set in environment. Skipping..."
    warn "  To set manually: wrangler secret put $secret"
  fi
done

# 驗證 Secrets
log "Verifying secrets..."
wrangler secret list

log "Secrets setup completed!"
warn "Please verify all required secrets are set correctly"

