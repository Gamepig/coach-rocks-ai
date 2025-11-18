#!/usr/bin/env bash
# GitLab Pipeline 清理腳本
# 用途: 批量清理舊的 Canceled 或 Failed 的 Pipelines

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

# 檢查是否安裝 jq
if ! command -v jq >/dev/null 2>&1; then
  err "jq 未安裝，請先安裝 jq:"
  echo "  macOS: brew install jq"
  echo "  Linux: sudo apt-get install jq"
  exit 1
fi

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
log "GitLab Pipeline 清理工具"
log "=========================================="
echo ""

# 顯示選單
echo "請選擇要清理的 Pipeline 狀態："
echo "  1) Canceled（已取消）"
echo "  2) Failed（失敗）"
echo "  3) Skipped（已跳過）"
echo "  4) 全部（Canceled + Failed + Skipped）"
echo "  5) 查看所有 Pipelines 狀態統計"
echo ""
read -p "請選擇 (1-5): " choice

case $choice in
  1)
    STATUS="canceled"
    STATUS_NAME="Canceled"
    ;;
  2)
    STATUS="failed"
    STATUS_NAME="Failed"
    ;;
  3)
    STATUS="skipped"
    STATUS_NAME="Skipped"
    ;;
  4)
    STATUS="all"
    STATUS_NAME="全部（Canceled + Failed + Skipped）"
    ;;
  5)
    log "Pipeline 狀態統計："
    echo ""
    for status in canceled failed skipped success running pending; do
      count=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipelines?status=$status&per_page=1" | \
        jq -r '. | length')
      if [ "$count" -gt 0 ]; then
        total=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
          "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipelines?status=$status" | \
          jq -r '. | length')
        echo "  $status: $total"
      fi
    done
    echo ""
    log "完成統計"
    exit 0
    ;;
  *)
    err "無效的選擇"
    exit 1
    ;;
esac

echo ""
warn "準備清理狀態為「$STATUS_NAME」的 Pipelines"
echo ""

# 取得要刪除的 Pipelines
if [ "$STATUS" = "all" ]; then
  log "取得所有 Canceled、Failed、Skipped 的 Pipelines..."
  PIPELINES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipelines?per_page=100" | \
    jq -r '.[] | select(.status == "canceled" or .status == "failed" or .status == "skipped") | .id')
else
  log "取得狀態為「$STATUS_NAME」的 Pipelines..."
  PIPELINES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipelines?status=$STATUS&per_page=100" | \
    jq -r '.[].id')
fi

PIPELINE_COUNT=$(echo "$PIPELINES" | grep -c . || echo "0")

if [ "$PIPELINE_COUNT" -eq 0 ]; then
  log "✅ 沒有找到需要清理的 Pipelines"
  exit 0
fi

echo ""
warn "找到 $PIPELINE_COUNT 個 Pipeline 需要清理"
echo ""
read -p "確認刪除？(y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  log "已取消"
  exit 0
fi

echo ""
log "開始清理..."

DELETED=0
FAILED=0

while IFS= read -r pipeline_id; do
  if [ -z "$pipeline_id" ]; then
    continue
  fi
  
  info "刪除 Pipeline #$pipeline_id..."
  
  if curl -s -X DELETE \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipelines/$pipeline_id" > /dev/null; then
    ((DELETED++))
  else
    ((FAILED++))
    err "刪除 Pipeline #$pipeline_id 失敗"
  fi
  
  # 避免 API 速率限制
  sleep 0.5
done <<< "$PIPELINES"

echo ""
log "=========================================="
log "清理完成"
log "=========================================="
echo ""
log "成功刪除: $DELETED 個 Pipeline"
if [ "$FAILED" -gt 0 ]; then
  err "刪除失敗: $FAILED 個 Pipeline"
fi
echo ""
log "可以前往以下頁面查看結果："
echo "  $GITLAB_URL/$PROJECT_PATH/-/pipelines"
echo ""

