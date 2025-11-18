#!/usr/bin/env bash
# D1 資料庫遷移腳本
# 用途: 套用 D1 資料庫遷移

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }

DB_NAME="${DB_NAME:-coachdb}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-backend/migrations}"
ENV="${ENV:-production}"  # local or production

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

# 檢查資料庫是否存在
if ! wrangler d1 list | grep -q "$DB_NAME"; then
  err "Database '$DB_NAME' not found. Run './scripts/setup_d1.sh' first."
  exit 1
fi

# 檢查遷移目錄
if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  err "Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# 套用遷移
if [[ "$ENV" == "local" ]]; then
  log "Applying migrations to LOCAL database: $DB_NAME"
  wrangler d1 migrations apply "$DB_NAME" --local
else
  log "Applying migrations to PRODUCTION database: $DB_NAME"
  wrangler d1 migrations apply "$DB_NAME"
fi

# 驗證遷移狀態
log "Verifying migration status..."
wrangler d1 migrations list "$DB_NAME"

log "Migrations applied successfully!"

