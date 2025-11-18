#!/usr/bin/env bash
# GitLab Pipeline Schedules 清理腳本
# 用途: 列出並刪除 GitLab Pipeline Schedules

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

PROJECT_PATH="coach-rocks/coach-rocks"
PROJECT_ID="${PROJECT_PATH//\//%2F}"
GITLAB_URL="https://gitlab.com"

# 取得 GitLab Token
if [ -z "${GITLAB_TOKEN:-}" ]; then
  warn "GITLAB_TOKEN 環境變數未設定"
  echo ""
  echo "請輸入 GitLab Personal Access Token（需要 api scope）:"
  read -s GITLAB_TOKEN
  echo ""
  export GITLAB_TOKEN
fi

# 驗證 Token
log "驗證 GitLab Token..."
if ! curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$GITLAB_URL/api/v4/user" > /dev/null; then
  err "Token 驗證失敗，請檢查 Token 是否正確"
  exit 1
fi
log "✅ Token 驗證成功"

echo ""
log "=========================================="
log "GitLab Pipeline Schedules 清理工具"
log "=========================================="
echo ""

# 取得所有排程
log "取得所有 Pipeline Schedules..."
SCHEDULES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipeline_schedules")

SCHEDULE_COUNT=$(echo "$SCHEDULES" | jq -r '. | length')

if [ "$SCHEDULE_COUNT" -eq 0 ]; then
  log "✅ 沒有找到任何排程"
  exit 0
fi

echo ""
log "找到 $SCHEDULE_COUNT 個排程："
echo ""

# 顯示所有排程
echo "$SCHEDULES" | jq -r '.[] | "\(.id) | \(.description // "無描述") | 啟用: \(.active) | 下次執行: \(.next_run_at // "無")"' | \
  while IFS='|' read -r id desc active next_run; do
    echo "  ID: $id"
    echo "  描述: $desc"
    echo "  狀態: $active"
    echo "  下次執行: $next_run"
    echo ""
  done

echo ""
warn "準備刪除所有排程"
echo ""
read -p "確認刪除所有 $SCHEDULE_COUNT 個排程？(y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  log "已取消"
  exit 0
fi

echo ""
log "開始刪除排程..."

DELETED=0
FAILED=0

echo "$SCHEDULES" | jq -r '.[].id' | while read -r schedule_id; do
  if [ -z "$schedule_id" ]; then
    continue
  fi
  
  # 取得排程描述以便顯示
  desc=$(echo "$SCHEDULES" | jq -r ".[] | select(.id == $schedule_id) | .description // \"無描述\"")
  info "刪除排程 #$schedule_id: $desc"
  
  if curl -s -X DELETE \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipeline_schedules/$schedule_id" > /dev/null; then
    ((DELETED++))
    log "  ✅ 已刪除"
  else
    ((FAILED++))
    err "  ❌ 刪除失敗"
  fi
  
  # 避免 API 速率限制
  sleep 0.5
done

echo ""
log "=========================================="
log "清理完成"
log "=========================================="
echo ""
log "成功刪除: $DELETED 個排程"
if [ "$FAILED" -gt 0 ]; then
  err "刪除失敗: $FAILED 個排程"
fi
echo ""
log "可以前往以下頁面查看結果："
echo "  $GITLAB_URL/$PROJECT_PATH/-/pipeline_schedules"
echo ""

