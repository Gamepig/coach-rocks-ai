#!/usr/bin/env bash
# Cloudflare 與 GitLab 連動設定腳本
# 參考舊專案設定

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

log "=========================================="
log "Cloudflare 與 GitLab 連動設定"
log "=========================================="
echo ""

info "⚠️  重要：GitLab 連動需要透過 Cloudflare Dashboard 進行授權"
info "   CLI 工具無法直接完成 GitLab 授權流程"
echo ""

log "步驟 1: 檢查當前狀態"
echo ""

# 檢查 Backend Worker
log "檢查 Backend Worker..."
BACKEND_DEPLOYMENTS=$(wrangler deployments list 2>&1 | head -5 || echo "")
if echo "$BACKEND_DEPLOYMENTS" | grep -q "coach-backend"; then
  info "✅ Backend Worker 'coach-backend' 已存在"
else
  warn "⚠️  Backend Worker 'coach-backend' 未找到"
fi

# 檢查 Frontend Pages
log "檢查 Frontend Pages..."
PAGES_PROJECTS=$(wrangler pages project list 2>&1 | grep "coach-rocks-frontend" || echo "")
if echo "$PAGES_PROJECTS" | grep -q "coach-rocks-frontend"; then
  info "✅ Frontend Pages 'coach-rocks-frontend' 已存在"
else
  warn "⚠️  Frontend Pages 'coach-rocks-frontend' 未找到"
fi

echo ""
log "步驟 2: 設定指南"
echo ""

cat << 'EOF'
📋 需要在 Cloudflare Dashboard 中完成的步驟：

1. 授權 GitLab 帳號
   - 前往: https://dash.cloudflare.com/
   - Workers & Pages → Create application → Pages → Connect to Git
   - 選擇 GitLab → + Add account → Authorize

2. 連接 Backend Worker 到 GitLab
   - Workers & Pages → coach-backend → Settings → Builds
   - Connect to Git → 選擇 GitLab → 選擇儲存庫: coach-rocks/coach-rocks
   - Root directory: backend
   - Production branch: main

3. 連接 Frontend Pages 到 GitLab
   - Workers & Pages → coach-rocks-frontend → Settings → Builds & deployments
   - Connect to Git → 選擇 GitLab → 選擇儲存庫: coach-rocks/coach-rocks
   - Root directory: frontend
   - Production branch: main
   - Build command: pnpm build
   - Build output directory: dist

4. 設定 Frontend 環境變數（如果尚未設定）
   - Settings → Environment variables
   - VITE_BACKEND_BASE_URL: https://coach-backend.gamepig1976.workers.dev

EOF

echo ""
log "步驟 3: GitLab CI/CD 設定（可選）"
echo ""

if [[ -f ".gitlab-ci.yml" ]]; then
  info "✅ .gitlab-ci.yml 已存在"
  echo ""
  info "如果使用 GitLab CI/CD，需要設定以下變數："
  echo ""
  echo "前往: https://gitlab.com/coach-rocks/coach-rocks/-/settings/ci_cd"
  echo "展開 Variables，新增："
  echo ""
  echo "  CLOUDFLARE_API_TOKEN: (Cloudflare API Token)"
  echo "  CLOUDFLARE_ACCOUNT_ID: 9288c023577aa2f6ce20582b6c4bdda0"
  echo "  VITE_BACKEND_BASE_URL: https://coach-backend.gamepig1976.workers.dev"
  echo ""
else
  warn "⚠️  .gitlab-ci.yml 不存在"
fi

echo ""
log "步驟 4: 驗證連動狀態"
echo ""

info "完成 Dashboard 設定後，可以執行以下命令驗證："
echo ""
echo "  # 檢查 Backend 部署"
echo "  cd backend && wrangler deployments list"
echo ""
echo "  # 檢查 Frontend Pages"
echo "  wrangler pages project list"
echo ""
echo "  # 推送測試 commit 觸發自動部署"
echo "  git commit --allow-empty -m 'test: trigger deployment'"
echo "  git push origin main"
echo ""

log "=========================================="
log "詳細說明請參考:"
log "  documents/gitlab_cloudflare_integration_setup.md"
log "=========================================="

