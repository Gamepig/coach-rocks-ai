#!/usr/bin/env bash
# D1 資料庫設定腳本
# 用途: 建立 D1 資料庫並更新 wrangler.jsonc

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }

DB_NAME="${DB_NAME:-coachdb}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-backend/wrangler.jsonc}"
OLD_DB_ID="d15ec66a-762c-40a2-bc8e-d64a1c8eb440"  # 舊專案的 Database ID（重用）

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

# 檢查資料庫是否已存在
log "Checking if database '$DB_NAME' exists..."
if wrangler d1 list | grep -q "$DB_NAME"; then
  DB_ID=$(wrangler d1 list | grep "$DB_NAME" | awk '{print $2}')
  log "Database '$DB_NAME' already exists"
  log "Database ID: $DB_ID"
  
  # 檢查是否為舊專案的資料庫
  if [[ "$DB_ID" == "$OLD_DB_ID" ]]; then
    log "✅ Found old project database. Reusing existing database."
    log "   This will preserve existing data."
  else
    warn "Database exists but with different ID: $DB_ID"
    warn "Expected old project ID: $OLD_DB_ID"
    warn "Please verify this is the correct database."
  fi
else
  warn "Database '$DB_NAME' not found."
  warn "This script is configured to reuse the old project database."
  warn "If you want to create a new database, please do so manually:"
  warn "  wrangler d1 create $DB_NAME"
  err "Exiting to prevent accidental database creation."
  exit 1
fi

# 更新 wrangler.jsonc（如果存在）
if [[ -f "$WRANGLER_CONFIG" ]]; then
  log "Updating $WRANGLER_CONFIG with database_id..."
  
  # 使用 sed 更新 database_id（簡單方法）
  if command -v jq >/dev/null 2>&1; then
    # 如果有 jq，使用 jq 更新（更安全）
    warn "jq found but JSONC parsing is complex. Please manually update database_id in $WRANGLER_CONFIG"
    warn "Set database_id to: $DB_ID"
  else
    # 簡單的 sed 替換（可能不完美）
    if grep -q "database_id" "$WRANGLER_CONFIG"; then
      sed -i.bak "s/\"database_id\":\s*\"[^\"]*\"/\"database_id\": \"$DB_ID\"/" "$WRANGLER_CONFIG"
      log "Updated database_id in $WRANGLER_CONFIG"
      rm -f "${WRANGLER_CONFIG}.bak"
    else
      warn "database_id not found in $WRANGLER_CONFIG. Please add manually:"
      warn "  \"database_id\": \"$DB_ID\""
    fi
  fi
else
  warn "$WRANGLER_CONFIG not found. Please manually add database_id: $DB_ID"
fi

log "D1 database setup completed!"
log "Database ID: $DB_ID"
log "Next step: Run './scripts/apply_migrations.sh' to apply migrations"

