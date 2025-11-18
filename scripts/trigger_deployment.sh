#!/usr/bin/env bash
# 手動觸發 GitLab CI/CD 部署
# 用途: 建立一個空的 commit 來觸發 Pipeline

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }

cd /Users/gamepig/projects/coach-rocks-main || {
  echo "錯誤: 找不到 coach-rocks-main 目錄"
  exit 1
}

log "檢查 Git 狀態..."
git status --short

echo ""
log "準備建立空的 commit 來觸發部署..."
read -p "確認繼續？(y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  log "已取消"
  exit 0
fi

echo ""
log "建立空的 commit..."
git commit --allow-empty -m "ci: 手動觸發部署

- 觸發 GitLab CI/CD Pipeline
- 部署 Backend 到 Cloudflare Workers
- 部署 Frontend 到 Cloudflare Pages"

log "推送到 GitLab..."
git push origin main

echo ""
log "=========================================="
log "部署已觸發"
log "=========================================="
echo ""
log "可以前往以下頁面查看 Pipeline 狀態："
echo "  https://gitlab.com/coach-rocks/coach-rocks/-/pipelines"
echo ""
log "Pipeline 會自動執行以下步驟："
echo "  1. deploy-backend - 部署後端到 Cloudflare Workers"
echo "  2. deploy-frontend - 部署前端到 Cloudflare Pages"
echo ""

