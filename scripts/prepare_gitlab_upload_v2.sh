#!/usr/bin/env bash
# 準備 GitLab 上傳的最小化檔案清單（版本 2）
# 排除測試、.md 內部文件、紀錄檔，只保留必要檔案

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

PROJECT_ROOT="$(cd "${1:-$(pwd)}" && pwd)"
OUTPUT_DIR="$(cd "${2:-${PROJECT_ROOT}/gitlab-upload}" && pwd 2>/dev/null || echo "${PROJECT_ROOT}/gitlab-upload")"

log "=========================================="
log "準備 GitLab 上傳檔案清單"
log "=========================================="
echo ""

info "專案根目錄: $PROJECT_ROOT"
info "輸出目錄: $OUTPUT_DIR"
echo ""

# 建立輸出目錄
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# 初始化 Git（如果尚未初始化）
if [[ ! -d ".git" ]]; then
  log "初始化 Git 儲存庫..."
  git init -q
fi

# 建立 .gitignore
log "設定 .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js
package-lock.json
pnpm-lock.yaml
yarn.lock

# Build outputs
dist/
build/
*.log

# Environment
.env
.env.local
.env.production
.env.*.local
.dev.vars
*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
test-results/
playwright-report/
coverage/

# Temporary files
tmp/
temp/
*.tmp
EOF

# 複製 Backend 必要檔案
log "複製 Backend 必要檔案..."
mkdir -p backend/src backend/migrations

# Backend 源碼
if [[ -d "$PROJECT_ROOT/backend/src" ]]; then
  cp -r "$PROJECT_ROOT/backend/src/"* backend/src/ 2>/dev/null || {
    warn "複製 backend/src 失敗，嘗試使用 rsync..."
    rsync -av --exclude='node_modules' --exclude='dist' "$PROJECT_ROOT/backend/src/" backend/src/ 2>/dev/null || true
  }
else
  err "Backend src 目錄不存在: $PROJECT_ROOT/backend/src"
fi

# Backend 遷移檔案
if [[ -d "$PROJECT_ROOT/backend/migrations" ]]; then
  cp -r "$PROJECT_ROOT/backend/migrations/"* backend/migrations/ 2>/dev/null || true
fi

# Backend 配置檔案
[[ -f "$PROJECT_ROOT/backend/package.json" ]] && cp "$PROJECT_ROOT/backend/package.json" backend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/backend/tsconfig.json" ]] && cp "$PROJECT_ROOT/backend/tsconfig.json" backend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/backend/wrangler.jsonc" ]] && cp "$PROJECT_ROOT/backend/wrangler.jsonc" backend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/backend/worker-configuration.d.ts" ]] && cp "$PROJECT_ROOT/backend/worker-configuration.d.ts" backend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/backend/README.md" ]] && cp "$PROJECT_ROOT/backend/README.md" backend/ 2>/dev/null || true

# 清理 Backend 不需要的檔案
log "清理 Backend 不需要的檔案..."
find backend -type f -name "test-*" -delete 2>/dev/null || true
find backend -type f -name "debug-*" -delete 2>/dev/null || true
find backend -type f -name "generate-*" -delete 2>/dev/null || true
find backend -type f -name "insert-*" -delete 2>/dev/null || true
find backend -type f -name "fix-*" -delete 2>/dev/null || true
find backend -type f -name "*.md" ! -name "README.md" -delete 2>/dev/null || true
find backend -type f -name "*.sql" ! -path "*/migrations/*" -delete 2>/dev/null || true
find backend -type f \( -name "*.bak" -o -name "*.backup" -o -name "ClientDetails.jsx" -o -name "*.bat" \) -delete 2>/dev/null || true

# 複製 Frontend 必要檔案
log "複製 Frontend 必要檔案..."
mkdir -p frontend/src frontend/public

# Frontend 源碼
if [[ -d "$PROJECT_ROOT/frontend/src" ]]; then
  cp -r "$PROJECT_ROOT/frontend/src/"* frontend/src/ 2>/dev/null || {
    warn "複製 frontend/src 失敗，嘗試使用 rsync..."
    rsync -av --exclude='node_modules' --exclude='dist' "$PROJECT_ROOT/frontend/src/" frontend/src/ 2>/dev/null || true
  }
else
  err "Frontend src 目錄不存在: $PROJECT_ROOT/frontend/src"
fi

# Frontend 公開資源
if [[ -d "$PROJECT_ROOT/frontend/public" ]]; then
  cp -r "$PROJECT_ROOT/frontend/public/"* frontend/public/ 2>/dev/null || true
fi

# Frontend 配置檔案
[[ -f "$PROJECT_ROOT/frontend/package.json" ]] && cp "$PROJECT_ROOT/frontend/package.json" frontend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/frontend/vite.config.js" ]] && cp "$PROJECT_ROOT/frontend/vite.config.js" frontend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/frontend/eslint.config.js" ]] && cp "$PROJECT_ROOT/frontend/eslint.config.js" frontend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/frontend/playwright.config.js" ]] && cp "$PROJECT_ROOT/frontend/playwright.config.js" frontend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/frontend/index.html" ]] && cp "$PROJECT_ROOT/frontend/index.html" frontend/ 2>/dev/null || true
[[ -f "$PROJECT_ROOT/frontend/README.md" ]] && cp "$PROJECT_ROOT/frontend/README.md" frontend/ 2>/dev/null || true

# 清理 Frontend 不需要的檔案
log "清理 Frontend 不需要的檔案..."
rm -rf frontend/tests frontend/test-results frontend/playwright-report frontend/frontend/tmp 2>/dev/null || true
find frontend -type f \( -name "debug-*.html" -o -name "markdown.md" -o -name "test-oauth-manual.js" -o -name "README_*.md" -o -name "*.bak" -o -name "*.backup" \) -delete 2>/dev/null || true

# 複製 Scripts
log "複製部署腳本..."
mkdir -p scripts
if [[ -d "$PROJECT_ROOT/scripts" ]]; then
  cp "$PROJECT_ROOT/scripts/"*.sh scripts/ 2>/dev/null || true
fi

# 複製 GitLab CI/CD 設定
log "複製 GitLab CI/CD 設定..."
[[ -f "$PROJECT_ROOT/.gitlab-ci.yml" ]] && cp "$PROJECT_ROOT/.gitlab-ci.yml" . 2>/dev/null || true

# 複製根目錄 README
log "複製 README..."
[[ -f "$PROJECT_ROOT/README.md" ]] && cp "$PROJECT_ROOT/README.md" . 2>/dev/null || true

# 建立上傳清單報告
log "建立上傳清單報告..."
cat > UPLOAD_LIST.md << EOF
# GitLab 上傳檔案清單

> **建立時間**: $(date)
> **狀態**: ✅ 準備完成

## 📋 上傳的檔案

### Backend
- ✅ \`backend/src/\` - 所有 TypeScript 源碼
- ✅ \`backend/migrations/\` - 資料庫遷移檔案
- ✅ \`backend/package.json\` - 依賴定義
- ✅ \`backend/tsconfig.json\` - TypeScript 配置
- ✅ \`backend/wrangler.jsonc\` - Cloudflare Workers 配置
- ✅ \`backend/worker-configuration.d.ts\` - 型別定義
- ✅ \`backend/README.md\` - Backend 說明文件

### Frontend
- ✅ \`frontend/src/\` - 所有 React 源碼
- ✅ \`frontend/public/\` - 公開靜態資源
- ✅ \`frontend/package.json\` - 依賴定義
- ✅ \`frontend/vite.config.js\` - Vite 配置
- ✅ \`frontend/eslint.config.js\` - ESLint 配置
- ✅ \`frontend/playwright.config.js\` - Playwright 配置
- ✅ \`frontend/index.html\` - 入口 HTML
- ✅ \`frontend/README.md\` - Frontend 說明文件

### Scripts
- ✅ \`scripts/\` - 所有部署腳本

### 根目錄
- ✅ \`.gitignore\` - Git 忽略規則
- ✅ \`.gitlab-ci.yml\` - GitLab CI/CD 設定
- ✅ \`README.md\` - 專案說明文件

## ❌ 排除的檔案

### 測試相關
- ❌ \`frontend/tests/\` - 測試檔案
- ❌ \`frontend/test-results/\` - 測試結果
- ❌ \`frontend/playwright-report/\` - 測試報告
- ❌ \`backend/test-*.js\` - 測試腳本

### 文件和紀錄檔
- ❌ 所有 \`.md\` 檔案（除了 README.md）
- ❌ \`documents/\` - 內部文件
- ❌ \`memory-bank/\` - 知識庫
- ❌ \`task_logs/\` - 任務日誌
- ❌ \`Tasks/\` - 任務管理
- ❌ \`rules-summary/\` - 規則摘要

### 開發工具
- ❌ \`node_modules/\` - 依賴（會自動安裝）
- ❌ \`dist/\` - 建置輸出（會自動生成）
- ❌ \`.dev.vars\` - 本地環境變數
- ❌ \`*.log\` - 日誌檔案
EOF

# 顯示統計資訊
log "=========================================="
log "檔案準備完成"
log "=========================================="
echo ""

info "輸出目錄: $OUTPUT_DIR"
echo ""

log "檔案統計:"
FILE_COUNT=$(find . -type f ! -path './.git/*' 2>/dev/null | wc -l | xargs)
echo "  總檔案數: $FILE_COUNT"
echo ""

log "目錄結構:"
find . -type d ! -path './.git/*' 2>/dev/null | head -20 | sed 's|^\./|  |' || echo "  無法列出目錄"

echo ""
log "下一步:"
info "1. 檢查輸出目錄: $OUTPUT_DIR"
info "2. 確認檔案清單: cat $OUTPUT_DIR/UPLOAD_LIST.md"
info "3. 初始化 Git 並推送到 GitLab:"
echo ""
echo "   cd $OUTPUT_DIR"
echo "   git add ."
echo "   git commit -m 'Initial commit: production-ready code'"
echo "   git remote add origin <GITLAB_REPO_URL>"
echo "   git push -u origin main"
echo ""

