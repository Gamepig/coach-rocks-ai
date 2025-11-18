#!/usr/bin/env bash
# 完整部署腳本
# 用途: 執行 Backend 和 Frontend 的完整部署流程

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 檢查前置條件
check_prerequisites() {
  log "Checking prerequisites..."
  
  require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
      err "Required command '$1' not found in PATH"
      exit 1
    fi
  }
  
  require_cmd wrangler
  require_cmd node
  require_cmd git
  
  if ! wrangler whoami >/dev/null 2>&1; then
    err "Not logged in to Cloudflare. Run 'wrangler login' first."
    exit 1
  fi
  
  log "Prerequisites check passed"
}

# 部署 Backend
deploy_backend() {
  log "=========================================="
  log "Deploying Backend (Cloudflare Workers)"
  log "=========================================="
  "$SCRIPT_DIR/deploy_backend.sh" || {
    err "Backend deployment failed"
    exit 1
  }
  log "Backend deployment completed"
}

# 部署 Frontend
deploy_frontend() {
  log "=========================================="
  log "Deploying Frontend (Cloudflare Pages)"
  log "=========================================="
  "$SCRIPT_DIR/deploy_frontend.sh" || {
    err "Frontend deployment failed"
    exit 1
  }
  log "Frontend deployment completed"
}

# 主流程
main() {
  log "=========================================="
  log "Starting Full Deployment"
  log "=========================================="
  
  check_prerequisites
  deploy_backend
  deploy_frontend
  
  log "=========================================="
  log "Full Deployment Completed Successfully!"
  log "=========================================="
  
  # 顯示部署資訊
  info "Deployment Summary:"
  info "  Backend: https://coach-backend.$(wrangler whoami | grep Account | awk '{print $NF}').workers.dev"
  info "  Frontend: https://coach-rocks-frontend.pages.dev"
  
  log "Next steps:"
  log "  1. Verify deployment: ./scripts/verify_backend.sh"
  log "  2. Monitor logs: wrangler tail coach-backend"
  log "  3. Check Cloudflare Dashboard for analytics"
}

main "$@"

