#!/usr/bin/env bash
# 設定 GitLab 儲存庫連動
# 參考舊專案的 GitLab 設定

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

OLD_PROJECT="${OLD_PROJECT:-/Users/gamepig/projects/coach-rocks-old}"
UPLOAD_DIR="${UPLOAD_DIR:-./gitlab-upload}"

log "=========================================="
log "設定 GitLab 儲存庫連動"
log "=========================================="
echo ""

# 檢查舊專案的 GitLab 設定
if [[ -d "$OLD_PROJECT" ]]; then
  log "檢查舊專案的 GitLab 設定..."
  OLD_REMOTE=$(cd "$OLD_PROJECT" && git config --get remote.origin.url 2>/dev/null || echo "")
  
  if [[ -n "$OLD_REMOTE" ]]; then
    info "舊專案 GitLab URL: $OLD_REMOTE"
    
    # 從舊專案 URL 提取 GitLab 資訊
    if [[ "$OLD_REMOTE" =~ git@gitlab\.com:([^/]+)/([^/]+)\.git ]]; then
      GITLAB_USER="${BASH_REMATCH[1]}"
      OLD_REPO_NAME="${BASH_REMATCH[2]}"
      info "GitLab 使用者: $GITLAB_USER"
      info "舊專案名稱: $OLD_REPO_NAME"
    elif [[ "$OLD_REMOTE" =~ https://gitlab\.com/([^/]+)/([^/]+)\.git ]]; then
      GITLAB_USER="${BASH_REMATCH[1]}"
      OLD_REPO_NAME="${BASH_REMATCH[2]}"
      info "GitLab 使用者: $GITLAB_USER"
      info "舊專案名稱: $OLD_REPO_NAME"
    fi
  else
    warn "舊專案沒有設定 Git remote"
  fi
else
  warn "舊專案目錄不存在: $OLD_PROJECT"
fi

echo ""
log "設定新專案的 GitLab 連動..."
echo ""

# 進入上傳目錄
if [[ ! -d "$UPLOAD_DIR" ]]; then
  err "上傳目錄不存在: $UPLOAD_DIR"
  err "請先執行: ./scripts/prepare_gitlab_upload_v2.sh"
  exit 1
fi

cd "$UPLOAD_DIR"

# 檢查是否已初始化 Git
if [[ ! -d ".git" ]]; then
  log "初始化 Git 儲存庫..."
  git init -q
fi

# 檢查是否已有 remote
EXISTING_REMOTE=$(git config --get remote.origin.url 2>/dev/null || echo "")

if [[ -n "$EXISTING_REMOTE" ]]; then
  warn "已存在 Git remote: $EXISTING_REMOTE"
  read -p "是否要更新 remote URL? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "保留現有 remote"
    exit 0
  fi
fi

# 詢問新專案名稱
echo ""
info "請輸入 GitLab 儲存庫資訊："
echo ""

if [[ -n "${GITLAB_USER:-}" ]]; then
  info "偵測到的 GitLab 使用者: $GITLAB_USER"
  read -p "GitLab 使用者名稱 [$GITLAB_USER]: " INPUT_USER
  GITLAB_USER="${INPUT_USER:-$GITLAB_USER}"
else
  read -p "GitLab 使用者名稱: " GITLAB_USER
fi

read -p "新專案名稱 [coach-rocks]: " REPO_NAME
REPO_NAME="${REPO_NAME:-coach-rocks}"

# 選擇使用 SSH 或 HTTPS
echo ""
info "選擇連線方式："
echo "  1) SSH (git@gitlab.com) - 推薦"
echo "  2) HTTPS (https://gitlab.com)"
read -p "請選擇 (1/2) [1]: " CONNECTION_TYPE
CONNECTION_TYPE="${CONNECTION_TYPE:-1}"

if [[ "$CONNECTION_TYPE" == "2" ]]; then
  GITLAB_URL="https://gitlab.com/${GITLAB_USER}/${REPO_NAME}.git"
else
  GITLAB_URL="git@gitlab.com:${GITLAB_USER}/${REPO_NAME}.git"
fi

echo ""
info "GitLab URL: $GITLAB_URL"
read -p "確認設定? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  warn "取消設定"
  exit 0
fi

# 設定 remote
log "設定 Git remote..."
if [[ -n "$EXISTING_REMOTE" ]]; then
  git remote set-url origin "$GITLAB_URL"
  info "已更新 remote URL"
else
  git remote add origin "$GITLAB_URL"
  info "已新增 remote"
fi

# 驗證 remote
log "驗證 remote 設定..."
git remote -v

echo ""
log "=========================================="
log "GitLab 設定完成"
log "=========================================="
echo ""

info "下一步："
echo ""
echo "1. 在 GitLab 建立新儲存庫:"
echo "   https://gitlab.com/${GITLAB_USER}/${REPO_NAME}"
echo ""
echo "2. 推送到 GitLab:"
echo "   cd $UPLOAD_DIR"
echo "   git add ."
echo "   git commit -m 'Initial commit: production-ready code'"
echo "   git push -u origin main"
echo ""

